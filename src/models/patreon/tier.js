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
  getHighestTier
}
