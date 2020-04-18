const { getDB } = require('../../setup/db');
const { Long } = require('mongodb');
const { patreon: patreonConfig, discord: discordConfig } = require('../../helpers/config');
const { hasPermission } = require('../../helpers/discord');
const refresh = require('passport-oauth2-refresh');
const { getHighestTier, tierMap, tierEnum } = require('./tier');
const crypto = require('crypto');
const got = require('got');

const events = [
  "members:create",
  "members:update",
  "members:delete",
  "members:pledge:create",
  "members:pledge:update",
  "members:pledge:delete"
]

function verifyWebhookSignature(signature, body) {
  const hmac = crypto.createHmac("md5", patreonConfig.webhook.secret);
  hmac.update(body);

  return hmac.digest("hex") === signature;
}

async function handleWebhookResponse(signature, event, rawdata, data) {
  if (!(event && signature && rawdata && data)) throw new Error("Missing params");
  if (!verifyWebhookSignature(signature, rawdata)) throw new Error("Signature invalid");
  if (!events.includes(event)) throw new Error("Event unsupported");
  if (!(data.relationships.currently_entitled_tiers.data &&
    data.relationships.user.data.id))
    throw new Error("Data structure invalid");

  const tiers = data.relationships.currently_entitled_tiers.data.map(({id}) => tierMap[id]);
  await getDB().patrons.findOneAndUpdate(
    { _id: data.relationships.user.data.id },
    {
      $set: {
        email: data.attributes.email,
        donationTotal: data.attributes.lifetime_support_cents,
        status: data.attributes.patron_status,
        tiers,
      }
    },
    {
      new: true,
      upsert: true
    }
  );

  let tier = getHighestTier(tiers);
  const user = await getDB().users.findOneAndUpdate(
    { "patreon.id": data.relationships.user.data.id },
    {
      $set: {
        'patreon.tier': tier
      }
    },
    {
      returnOriginal: false
    }
  );
  if (user.value) correctGuildSupporter(user.value._id.toString());
}

async function updateSupportersForMany(guildIdArray, userId, action) {
  let query = "";
  if (action === "add") query = "$addToSet";
  else if (action === "remove") query = "$pull";
  if (query === "") return false;
  let updateField = {};
  updateField[query] = {
    supporters: Long.fromString(userId)
  }
  await getDB().guilds.updateMany({
    _id: {
      $in: guildIdArray.map(id => Long.fromString(id))
    }
  }, updateField);
}

async function getSupportedGuilds(userId) {
  let guildCursor = await getDB().guilds.find(
    { supporters: Long.fromString(userId) },
    { _id: 1 }
  );
  const guilds = (await guildCursor.toArray()).map(({_id}) => _id.toString());

  return guilds;
}

async function getUserGuilds(userId, {accessToken, refreshToken}) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await got(`${discordConfig.api_host}/users/@me/guilds`, {
        headers: {
          'Authorization': 'Bearer ' + accessToken
        },
        responseType: 'json',
      });
      return resolve(response.body);
    } catch (e) {
      try {
        refresh.requestNewAccessToken('discord', refreshToken, async function(err, newAccessToken, newRefreshToken) {
          if (err) throw new Error("Refresh failed");
          await getDB().users.updateOne({
            _id: Long.fromString(userId)
          }, {
            $set: {
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            }
          });
          const response = await got(`${discordConfig.api_host}/users/@me/guilds`, {
            headers: {
              'Authorization': 'Bearer ' + newAccessToken
            },
            responseType: 'json',
          });
          return resolve(response.body);
        });
      } catch (err) {
        reject(err);
      }
    }
  });
}

/// Remove user as guild supporter if patreon is unlinked
/// Remove user as guild supporter if tier is free
/// Add user as guild supporter if they have ADMINISTRATOR or MANAGE_GUILD permissions
/// Remove user as guild supporter if they lack ADMINISTRATORR or MANAGE_GUILD permissions
/// Remove user as guild supporter in guilds they are not part of
async function correctGuildSupporter(discordUserId) {
  const user = await getDB().users.findOne(
    { _id: Long.fromString(discordUserId) }
  );

  if (!user) throw new Error("Couldn't find discord user");

  const supporterGuildIds = await getSupportedGuilds(discordUserId)

  // If user is unlinked but still supporting a guild, yeet em out
  if (!user.patreon || (user.patreon && user.patreon.isLinkedPatreon === false)) {
    if (supporterGuildIds.length > 0) {
      await updateSupportersForMany(supporterGuildIds, discordUserId, "remove")
    }
    return;
  }

  // remove from all supporting guilds if tier is reset
  if (user.patreon.tier == tierEnum.default) {
    await updateSupportersForMany(supporterGuildIds, discordUserId, "remove")
    return;
  }

  // loop over guilds and update supporters array accordingly
  const userGuilds = await getUserGuilds(user._id.toString(), user)
  const updateObj = {
    toRemove: [],
    toAdd: [],
  }

  for (let userGuild of userGuilds) {
    const guildIndex = supporterGuildIds.indexOf(userGuild.id);
    // IF guild is in both userGuilds AND supporterGuild
    if (guildIndex != -1) {
      supporterGuildIds[guildIndex] = undefined;
      if (!hasPermission(userGuild.permissions, "ADMINISTRATOR") &&
        !hasPermission(userGuild.permissions, "MANAGE_GUILD")) {
        updateObj.toRemove.push(userGuild.id.toString())
      }
    }
    // IF guild is only in userGuilds AND has permissions
    else if (hasPermission(userGuild.permissions, "ADMINISTRATOR") ||
      hasPermission(userGuild.permissions, "MANAGE_GUILD")) {
      updateObj.toAdd.push(userGuild.id.toString())
    }
  }
  // IF guild is only in supporterGuilds
  for (let val of supporterGuildIds) {
    if (val) updateObj.toRemove.push(userGuild.id.toString());
  }

  await Promise.all([
    updateSupportersForMany(updateObj.toRemove, discordUserId, "remove"),
    updateSupportersForMany(updateObj.toAdd, discordUserId, "add")
  ])
}

// test function
async function testWebhook(testnum) {
  if (testnum == 1)
    await handleWebhookResponse(true, "members:pledge:create", true, require("../../../tests/pledge-create.json").data);
  else if (testnum == 2)
    await handleWebhookResponse(true, "members:update", true, require("../../../tests/pledge-refund.json").data);
}

module.exports = {
  verifyWebhookSignature,
  handleWebhookResponse,
  correctGuildSupporter,
  testWebhook
};
