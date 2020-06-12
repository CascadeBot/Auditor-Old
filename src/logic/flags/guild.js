const { updateFlags } = require("./updateflags");
const { getDB } = require("../../setup/db");
const { unknownError } = require("../../helpers/errors");

const { updateGuildDataForGuildIds } = require("../guilddata/update");

async function updateGuildFlags(guildId, clear, add, remove) {

  const session = getDB().client.startSession();

  try {
    session.startTransaction();

    const res = await updateFlags(session, getDB().guilds, "flags", guildId, {}, {clear, add, remove});
    if (!res)
      throw new Error(unknownError);

    await updateGuildDataForGuildIds(session, [guildId]);

    await session.commitTransaction();
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
