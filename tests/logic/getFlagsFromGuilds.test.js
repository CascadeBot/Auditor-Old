const { getFlagsFromGuilds } = require("../../src/logic/guilddata/getflags");
const { tierEnum, tierFlags } = require("../../src/models/patreon/tier");

const flagOne = {
  name: "flagone",
  scope: "guild"
}
const flagTwo = {
  name: "flagtwo",
  scope: "guild"
}
const flagThree = {
  name: "flagthree",
  scope: "guild"
}
const flagOneUser = {
  name: "flagone",
  scope: "user"
}

const flagDataOne = {
  name: "flagdata",
  scope: "guild",
  type: "amount",
  data: {
    amount: 5
  }
}
const flagDataTwo = {
  name: "flagdata",
  scope: "guild",
  type: "amount",
  data: {
    amount: 999
  }
}

function supporter(id, flags = [], tier = tierEnum.default) {
  return {
    id,
    flags,
    tier
  }
}

const defaultFlags = tierFlags.default.filter(flag => flag.scope === "guild");
const mediumFlags = tierFlags.medium.filter(flag => flag.scope === "guild");

describe("Get flags from guilds", () => {

  // error handling
  it("should return empty object", () => {
    const flags = getFlagsFromGuilds({});
    expect(flags).toEqual({});
  })

  // basic tests
  it("should return correct data for multiple", () => {
    const flags = getFlagsFromGuilds({
      "123": {
        id: "123",
        flags: [flagOne],
        supporters: [
          supporter("1", [flagTwo, flagOneUser]),
          supporter("2", [flagTwo, flagThree, flagOneUser], tierEnum.medium)
        ]
      },
      "1234": {
        id: "1234",
        flags: [flagTwo],
        supporters: []
      }
    });

    expect(flags).toEqual({
      "123": {
        id: "123",
        highestTier: tierEnum.medium,
        tiers: [tierEnum.default, tierEnum.medium],
        guildFlags: [flagOne],
        userFlags: [flagTwo, flagThree],
        allFlags: [flagOne, flagTwo, flagThree,
          ...defaultFlags, ...mediumFlags]
      },
      "1234": {
        id: "1234",
        highestTier: tierEnum.default,
        tiers: [],
        guildFlags: [flagTwo],
        userFlags: [],
        allFlags: [flagTwo]
      }
    })
  })

  it("should return correct flag for duplicate flags with data", () => {
    const flags = getFlagsFromGuilds({
      "123": {
        id: "123",
        flags: [],
        supporters: [
          supporter("1", [flagDataOne, flagOneUser]),
          supporter("2", [flagDataTwo])
        ]
      }
    });

    expect(flags).toEqual({
      "123": {
        id: "123",
        highestTier: tierEnum.default,
        tiers: [tierEnum.default],
        guildFlags: [],
        userFlags: [flagDataTwo],
        allFlags: [flagDataTwo, ...defaultFlags]
      }
    })
  })
})
