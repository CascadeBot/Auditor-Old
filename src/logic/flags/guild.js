const { updateFlags } = require("./updateflags");
const { getDB } = require("../../setup/db");

async function updateGuildFlags(guildId, clear, add, remove) {
  // TODO make system
  // const res = await updateFlags(getDB().guilds, "flags", guildId, {}, {clear, add, remove});
  // if (!res)
  //   return false;

  // 1. run updateguilddata
}

module.exports = {
  updateGuildFlags
}
