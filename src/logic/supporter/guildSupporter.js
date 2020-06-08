const { updateSupporting } = require("./updateSupporters");
const { getIncorrectSupportingFromUser } = require("./guildIncorrect");
const { updateGuildDataForGuildIds } = require("../guilddata");

async function updateGuildSupporter(userId, action, hasFlagChange) {
  // start db transaction
  const session = getDB().client.startSession();

  try {
    session.startTransaction();

    // 1. call action
    if (action)
      await action(session, userId);

    // 2. get guild changelog
    const guildsToResolve = await getIncorrectSupportingFromUser(session, userId);

    // 3. update supporters array
    await updateSupporting(session, userId, guildsToResolve);

    // 4. update guild data
    const guilds = hasFlagChange ? guildsToResolve.allGuilds : guildsToResolve.changedGuilds;
    await updateGuildDataForGuildIds(session, guilds);

    // commit transaction
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
  updateGuildSupporter
};
