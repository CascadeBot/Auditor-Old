const { getDB } = require("../../setup/db");
const { getFlagsFromGuilds } = require("./getFlags");
const { updateModlogTimeForMany } = require("./modlog");
const { getTier, hasGuildFlags } = require("../user/user");
const { Long } = require("mongodb");

function updateGuildDataForMany(session, guilds) {
  // get all of the flags per guild
  const guildData = getFlagsFromGuilds(guilds);

  // TODO optimisation: only run modlog change if modlog time changes
  // update modlog for all guilds
  updateModlogTimeForMany(session, guildData);
}

/* return value: {
  guildId: {
    id: guildId,
    flags: [...],
    supporters: [{
      id: userId,
      flags: [...],
      tier: "tierHere"
    }, ...]
  }, ...
}*/
async function gatherGuilds(session, guildIds = []) {
  if (guildIds.length == 0)
    return {};
  guildIds = guildIds.map(id => Long.fromString(id));

  // gather guilds with flags
  const flagGuildCursor = await getDB().guilds.find({
    _id: { $in: guildIds },
    flags: { $exists: true, $ne: [] }
  }, {session});
  const flagGuilds = await flagGuildCursor.toArray();

  // gather users that are supporting the guilds
  const userCursor = await getDB().users.find({
    supporting: {
      elemMatch: {
        $in: guildIds
      }
    }
  }, {session});
  const users = await userCursor.toArray();

  const out = {};

  // set initial value for all guilds
  for (let guildId of guildsIds) {
    out[guildId] = {
      id: guildId,
      supporters: [],
      flags: []
    }
  }

  // set flags of guilds with flags
  for (let flagGuild of flagGuilds) {
    if (!flagGuild.flags)
      continue;
    out[flagGuild._id].flags = [...flagGuild.flags];
  }

  // add users to the guild supporters array
  for (let user of users) {
    if (!user.supporting)
      continue;
    const toPush = {
      id: user._id,
      tier: getTier(user),
      flags: hasGuildFlags(user) ? user.flags : []
    }
    user.supporting.forEach(
      guildId => out[guildId].supporters.push(toPush)
    );
  }

  return out;
}

async function updateGuildDataForGuildIds(session, guildIds = []) {
  // gather guilds
  const guilds = await gatherGuilds(session, guildIds);

  // update guilddata for guilds
  await updateGuildDataForMany(session, guilds);
}

module.exports = {
  updateGuildDataForMany,
  updateGuildDataForGuildIds
}
