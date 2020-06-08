const { updateFlags } = require("./updateflags");
const { updateGuildSupporter } = require("../supporter/guildSupporter");
const { getDB } = require("../../setup/db");

async function updateUserFlags(userId, clear, add, remove) {
  // TODO optimisation: only call update if
  // -> goes from no guild scope to has guild scope
  // -> goes from has guild scope to no guild scope

  await updateGuildSupporter(
    userId,
    async (session, user) => {
      const res = await updateFlags(session, getDB().users, "flags", user, {
        accessToken: {
          $exists: true
        }
      }, {clear, add, remove});
      if (!res)
        throw new Error("Something went wrong!");
    },
    true
  )
}

module.exports = {
  updateUserFlags
}
