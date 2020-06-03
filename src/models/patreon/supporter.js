const { getDB } = require('../../setup/db');
const { Long } = require('mongodb');
const { discord: discordConfig } = require('../../helpers/config');
const { hasPermission } = require('../../helpers/discord');
const refresh = require('passport-oauth2-refresh');
const { tierEnum } = require('./tier');
const got = require('got');
const { DiscordUser } = require("discord-user-js");

const userNotFoundError = new Error("user not found");
const userNullError = new Error("user cannot be null");
const discordCallError = new Error("Discord failed to be called");

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
  try {
    const user = new DiscordUser({
      accessToken,
      refreshToken,
      scopes: discordConfig.user_scopes,
      userId
    });
    const guilds = await user.getUserGuilds();
    if (guilds === false)
      return false;
    return guilds.body;
  } catch(e) {
    console.log(e);
    return false;
  }
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

  if (!user.blacklist) user.blacklist = [];
  let blacklist = user.blacklist.map((val) => val.toString());

  const supporterGuildIds = await getSupportedGuilds(discordUserId);

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
  const userGuilds = await getUserGuilds(user._id.toString(), user);
  if (userGuilds === false)
    throw discordCallError;

  const updateObj = {
    toRemove: [],
    toAdd: [],
  }

  for (let userGuild of userGuilds) {
    if (blacklist.includes(userGuild.id))
      continue
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
  // IF guild is only in supporterGuilds (or blacklisted)
  for (let val of supporterGuildIds) {
    if (val) updateObj.toRemove.push(val);
  }

  const promiseArr = [];
  if (updateObj.toRemove.length != 0)
    promiseArr.push(updateSupportersForMany(updateObj.toRemove, discordUserId, "remove"));
  if (updateObj.toAdd.length != 0)
    promiseArr.push(updateSupportersForMany(updateObj.toAdd, discordUserId, "add"));
  if (promiseArr.length != 0)
    await Promise.all(promiseArr);
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
