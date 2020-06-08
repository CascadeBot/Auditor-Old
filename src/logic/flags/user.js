const { updateFlags } = require("./updateflags");
const { getDB } = require("../../setup/db");

async function updateUserFlags(userId, clear, add, remove) {
  // TODO optimize, only call update if
  // -> goes from no guild scope to has guild scope
  // -> goes from has guild scope to no guild scope

  // const res = await updateFlags(getDB().users, "flags", userId, {
  //   accessToken: {
  //     $exists: true
  //   }
  // }, {clear, add, remove});
  // if (!res)
  //   return false;

  // TODO make system
  // 1. run update supporter (hasflags true)
  // 1.1 with action of flag update
}

module.exports = {
  updateUserFlags
}
