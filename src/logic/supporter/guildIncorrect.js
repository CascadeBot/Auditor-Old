const { getDB } = require('../../setup/db');
const { Long } = require('mongodb');
const { discord: discordConfig } = require('../../helpers/config');
const { hasPermission } = require('../../helpers/discord');
const { tierEnum } = require('../../models/patreon/tier');
const { DiscordUser } = require("discord-user-js");
const { getTier, hasGuildFlags, hasPatreonLinked } = require("../user/user");

const userNotFoundError = new Error("user not found");
const discordCallError = new Error("Discord failed to be called");

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

async function getIncorrectSupportingFromUser(session, userId) {
  const user = await getDB().users.findOne(
    { _id: Long.fromString(userId) }
  );
  if (!user) throw userNotFoundError;

  if (!user.blacklist) user.blacklist = [];
  let blacklist = user.blacklist.map((val) => val.toString());

  if (!user.supporting) user.supporting = [];
  let supporting = user.supporting.map((val) => val.toString());

  if (!hasGuildFlags(user) &&
    (!hasPatreonLinked(user) || getTier(user) == tierEnum.default)) {
    return {
      allGuilds: supporting,
      changedGuilds: supporting,
      toRemove: supporting,
      toAdd: []
    }
  }

  const userGuilds = await getUserGuilds(userId, user);
  if (userGuilds === false)
    throw discordCallError;

  const updateObj = {
    toRemove: [],
    toAdd: []
  }

  let supporterGuildIds = [...supporting];

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

  return {
    allGuilds: [...supporting, ...updateObj.toAdd],
    changedGuilds: [...updateObj.toAdd, ...updateObj.toRemove],
    toRemove: updateObj.toRemove,
    toAdd: updateObj.toAdd
  }
}

module.exports = {
  getIncorrectSupportingFromUser,
  userNotFoundError
};
