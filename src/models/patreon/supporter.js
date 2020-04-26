const { getDB } = require('../../setup/db');
const { Long } = require('mongodb');
const { discord: discordConfig } = require('../../helpers/config');
const { hasPermission } = require('../../helpers/discord');
const refresh = require('passport-oauth2-refresh');
const { tierEnum } = require('./tier');
const got = require('got');

const userNotFoundError = new Error("user not found");
const userNullError = new Error("user cannot be null");

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

function hasFlags(user) {
  if (!user) throw userNullError;
  if (!user.flags) return false;
  if (user.flags.length === 0) return false;
  return true;
}

function hasPatreonLinked(user) {
  if (!user) throw userNullError;
  if (!user.patreon) return false;
  if (!user.patreon.isLinkedPatreon) return false;
  return true;
}

function getTier(user) {
  if (!user) throw userNullError;
  if (!hasPatreonLinked(user)) return tierEnum.default;
  if (!user.patreon.tier) return tierEnum.default;
  return user.patreon.tier;
}

/// Remove user as guild supporter if patreon is unlinked (and no flags)
/// Remove user as guild supporter if tier is free (and no flags)
/// Add user as guild supporter if they have ADMINISTRATOR or MANAGE_GUILD permissions and a tier or flags
/// Remove user as guild supporter if they lack ADMINISTRATOR or MANAGE_GUILD permissions
/// Remove user as guild supporter in guilds they are not part of
async function correctGuildSupporter(discordUserId) {
  const user = await getDB().users.findOne(
    { _id: Long.fromString(discordUserId) }
  );

  if (!user) throw userNotFoundError;

  const supporterGuildIds = await getSupportedGuilds(discordUserId)

  // If user is unlinked and doesn't have flags but still supporting a guild, yeet em out
  if (!hasFlags(user) && !hasPatreonLinked(user)) {
    if (supporterGuildIds.length > 0) {
      await updateSupportersForMany(supporterGuildIds, discordUserId, "remove")
    }
    return;
  }

  // remove from all supporting guilds if tier is reset and no flags
  if (!hasFlags(user) && getTier(user) == tierEnum.default) {
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
    if (val) updateObj.toRemove.push(val);
  }

  await Promise.all([
    updateSupportersForMany(updateObj.toRemove, discordUserId, "remove"),
    updateSupportersForMany(updateObj.toAdd, discordUserId, "add")
  ])
}

module.exports = {
  correctGuildSupporter,
  getTier,
  hasFlags,
  hasPatreonLinked,
  getSupportedGuilds,
  userNotFoundError,
  userNullError
};
