const { getHighestTier, tierFlags } = require("../../models/patreon/tier")

function compareFlagData(flagone, flagtwo) {
  if (flagone.name !== flagtwo.name)
    return false;
  if (flagone.type !== flagtwo.type)
    return false;
  if (!flagone.type)
    return flagone;

  switch (flagone.type) {
    case "time":
      if (flagone.data.time >= flagtwo.data.time)
        return flagone;
      return flagtwo;
    case "amount":
      if (flagone.data.amount >= flagtwo.data.amount)
        return flagone;
      return flagtwo;
  }
  return false;
}

function filterDuplicateFlags(flags) {
  let out = [];

  for (let flag of flags) {
    let i = getFromFlags(flag.name, out, true)
    if (i == -1) {
      out.push(flag);
    } else {
      out[i] = compareFlagData(flag, out[i]);
    }
  }
  return out;
}

function getFlagsFromGuilds(guilds) {
  const out = {};

  let guildEntries = Object.values(guilds);
  for (let guild of guildEntries) {
    let tiers = [];
    let userFlags = [];
    for (let user of guild.supporters) {
      tiers.push(user.tier);
      if (user.flags.length > 0) {
        let guildScopesFlags = user.flags.filter((val) => val.scope === "guild");
        userFlags = [...userFlags, ...guildScopesFlags];
      }
    }

    const allTiers = [...(new Set(tiers))];
    let guildTierFlags = allTiers.map(tier => {
      return tierFlags[tier].filter(flag => flag.scope === "guild");
    });
    guildTierFlags = guildTierFlags.reduce((prev, cur) => [...prev, ...cur], []);

    out[guild.id] = {
      id: guild.id,
      highestTier: getHighestTier(tiers),
      tiers: allTiers,
      guildFlags: guild.flags,
      userFlags: filterDuplicateFlags(userFlags),
      allFlags: filterDuplicateFlags([...guild.flags, ...userFlags, ...guildTierFlags])
    };
  }

  return out;
}

function getFromFlags(flag, flags = [], returnIndex = false) {
  if (returnIndex)
    return flags.findIndex(v => v.name == flag);
  return flags.find(v => v.name == flag);
}

module.exports = {
  getFlagsFromGuilds,
  getFromFlags
};
