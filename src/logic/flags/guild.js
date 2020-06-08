const { updateFlags } = require("./updateflags");
const { getDB } = require("../../setup/db");

async function updateGuildFlags(guildId, clear, add, remove) {

  const session = getDB().client.startSession();

  try {
    session.startTransaction();

    const res = await updateFlags(session, getDB().guilds, "flags", guildId, {}, {clear, add, remove});
    if (!res)
      throw new Error("Something went wrong!");

    await updateGuildDataForGuildIds(session, [guildId]);

  } catch (e) {
    // something went wrong, abort
    await session.abortTransaction();

    throw e;
  } finally {
    session.endSession();
  }
}

module.exports = {
  updateGuildFlags
}
