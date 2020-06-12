const { patreon: patreonConfig } = require('../../helpers/config');

const tierEnum = {
  default: "default",
  cheap: "cheap",
  medium: "medium",
  hardcode: "hardcode"
}

const tierEnumCaps = {
  default: "DEFAULT",
  cheap: "CHEAP",
  medium: "MEDIUM",
  hardcode: "HARDCODE"
}

// TODO make actual data
const tierFlags = {
  default: [{
    name: "defaultflag",
    scope: "guild"
  }, {
    name: "defaultuserflag",
    scope: "user"
  }],
  cheap: [{
    name: "cheapflag",
    scope: "guild"
  }],
  medium: [{
    name: "mediumflag",
    scope: "guild"
  }],
  hardcode: [{
    name: "hardcodeflag",
    scope: "guild"
  }]
}

let tierMap = {};
tierMap[patreonConfig.tiers.cheap] = tierEnum.cheap;
tierMap[patreonConfig.tiers.medium] = tierEnum.medium;
tierMap[patreonConfig.tiers.hardcode] = tierEnum.hardcode;

function getHighestTier(tierArray) {
  let tier = tierEnum.default;
  if (tierArray.includes(tierEnum.hardcode)) tier = tierEnum.hardcode;
  else if (tierArray.includes(tierEnum.medium)) tier = tierEnum.medium;
  else if (tierArray.includes(tierEnum.cheap)) tier = tierEnum.cheap;
  return tier;
}

module.exports = {
  tierEnum,
  tierEnumCaps,
  tierMap,
  tierFlags,
  getHighestTier
}
