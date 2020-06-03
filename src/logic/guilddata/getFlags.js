function getFlagsFromGuilds(guilds) {
  // TODO make system
  /*
  1. go through supporters and sort tiers and flags into guilds
    1.1 use updateQuery to get new supporter data (if passed in)
  2. filter out user scope flags
  3. filter out highest data from duplicate flags
  4. return guild flags
  */
  return {
    "123": {
      tier: "asd",
      flags: ["FLAG"],
      allFlags: ["FLAG", "ASD_FLAG"]
    }
  }
}

function getFromFlags(flags) {
  // TODO make system
  return {};
}

module.exports = {
  getFlagsFromGuilds,
  getFromFlags
};
