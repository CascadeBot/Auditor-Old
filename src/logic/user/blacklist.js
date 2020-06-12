const { getDB } = require("../../setup/db");
const { userNotFoundError } = require("../../helpers/errors");
const { Long } = require("mongodb");

async function addToBlacklist(session, userId, guildId) {
  const oldUser = await getDB().users.findOneAndUpdate({
    _id: Long.fromString(userId)
  }, {
    $addToSet: {
      blacklist: Long.fromString(guildId)
    },
    $pull: {
      supporting: Long.fromString(guildId)
    }
  }, { session });
  if (!oldUser || oldUser.value === null) {
    throw new Error(userNotFoundError);
  }
  return true;
}

async function removeFromBlacklist(session, userId, guildId) {
  const oldUser = await getDB().users.findOneAndUpdate({
    _id: Long.fromString(userId)
  }, {
    $pull: {
      blacklist: Long.fromString(guildId)
    }
  }, { session });
  if (!oldUser || oldUser.value === null) {
    throw new Error(userNotFoundError);
  }
  return true;
}

module.exports = {
  addToBlacklist,
  removeFromBlacklist
};
