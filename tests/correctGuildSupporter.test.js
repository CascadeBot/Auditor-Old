const { correctGuildSupporter,
  getSupportedGuilds, tierEnum, userNotFoundError } = require('../src/models/patreon');
const { setupDB, getDB } = require('../src/setup/db');
const { Long } = require("mongodb");

const { DiscordUser } = require("discord-user-js");
const mockGetUserGuilds = jest.fn();
jest.mock('discord-user-js', () => {
  return {
    DiscordUser: jest.fn().mockImplementation(() => {
      return {
        getUserGuilds: mockGetUserGuilds
      };
    })
  }
});

// TODO test getUserGuilds
// # getUserGuilds(userId, {accessToken, refreshToken})
// ???????????

const userNotExistID = 100;
const userID = 101;
const userNoSupportID = 102;

const userWithout = {
  _id: Long.fromNumber(userID),
  accessToken: "access",
  refreshToken: "refresh",
  patreon: {
    isLinkedPatreon: false,
    tier: tierEnum.default
  },
  blacklist: []
}

const userWithDefaultTier = {
  _id: Long.fromNumber(userID),
  accessToken: "access",
  refreshToken: "refresh",
  patreon: {
    isLinkedPatreon: true,
    tier: tierEnum.default
  },
  blacklist: []
}

const userWithTier = {
  _id: Long.fromNumber(userID),
  accessToken: "access",
  refreshToken: "refresh",
  patreon: {
    isLinkedPatreon: true,
    tier: tierEnum.medium
  },
  blacklist: []
}

const userWithFlags = {
  _id: Long.fromNumber(userID),
  accessToken: "access",
  refreshToken: "refresh",
  flags: ["FLAG"],
  patreon: {
    isLinkedPatreon: false,
    tier: tierEnum.default
  },
  blacklist: []
}

const userFull = {
  _id: Long.fromNumber(userID),
  accessToken: "access",
  refreshToken: "refresh",
  flags: ["FLAG"],
  patreon: {
    isLinkedPatreon: true,
    tier: tierEnum.hardcode
  },
  blacklist: []
}

const userBlacklist = {
  _id: Long.fromNumber(userID),
  accessToken: "access",
  refreshToken: "refresh",
  flags: ["FLAG"],
  patreon: {
    isLinkedPatreon: true,
    tier: tierEnum.hardcode
  },
  blacklist: [Long.fromNumber(201), Long.fromNumber(202)]
}

const userBlacklistTwo = {
  _id: Long.fromNumber(userID),
  accessToken: "access",
  refreshToken: "refresh",
  flags: ["FLAG"],
  patreon: {
    isLinkedPatreon: true,
    tier: tierEnum.hardcode
  },
  blacklist: [Long.fromNumber(211), Long.fromNumber(212)]
}

const isSupport = [
  201,
  202
];

const noSupport = [
  211,
  212
];

const makeGuild = (id, supporters = []) => ({
  _id: id,
  supporters
})

const makeDiscordGuild = (id, hasperms = false) => ({
  id: id,
  permissions: hasperms ? 24 : 0
})

function discordBody(hasPerms) {
  return {
    body: [
      ...isSupport.map(id => makeDiscordGuild(id.toString(), hasPerms)),
      ...noSupport.map(id => makeDiscordGuild(id.toString(), hasPerms))
    ]
  }
}

const mockGuilds = [
  ...isSupport.map(id => makeGuild(Long.fromNumber(id), [userID])),
  ...noSupport.map(id => makeGuild(Long.fromNumber(id)))
]

function idInBlacklist(blacklist, id) {
  for (let item of blacklist) {
    if (item.toString() === id.toString())
      return true;
  }
  return false
}

function getMockGuilds(hasSupporters, blacklist) {
  return [
    ...isSupport.map(id => makeGuild(id, (hasSupporters && !idInBlacklist(blacklist, id)) ? [userID] : undefined)),
    ...noSupport.map(id => makeGuild(id, (hasSupporters && !idInBlacklist(blacklist, id)) ? [userID] : undefined))
  ]
}

async function makeUser(user) {
  await getDB().users.insertOne(user);
}

function prepareDB() {
  beforeAll(async () => {
    await setupDB(process.env.MONGO_URL, "jest")
  })

  afterAll(async () => {
    await getDB().users.deleteMany({});
    await getDB().guilds.deleteMany({});
    await getDB().rootClient.close();
  })

  beforeEach(async () => {
    await getDB().guilds.insertMany(mockGuilds);
  })

  afterEach(async () => {
    await getDB().users.deleteMany({});
    await getDB().guilds.deleteMany({});
  })
}


describe("getSupportedGuilds", () => {
  prepareDB()

  it("returns a list of guild ids that the user supports", async () => {
    const res = await getSupportedGuilds(userID.toString())
    expect(res.length).toEqual(isSupport.length)

    expect(res).toEqual(expect.arrayContaining(
      isSupport.map(id => id.toString())
    ));

    expect(res).not.toEqual(expect.arrayContaining(
      noSupport.map(id => id.toString())
    ));
  })

  it("return empty array for user that doesn't support any guild", async () => {
    const res = await getSupportedGuilds(userNoSupportID.toString())
    expect(res.length).toBe(0)
    expect(res).toEqual([])
  })
})


describe("correctGuildSupporter", () => {
  prepareDB()

  // basic tests
  it("throws error when user doesn't exist", async () => {
    expect(correctGuildSupporter(userNotExistID.toString()))
      .rejects.toEqual(userNotFoundError)
  })

  async function guildSupporterTest(user, body, mockguildsHasSupporters) {
    await makeUser(user);
    mockGetUserGuilds.mockResolvedValue(body);

    await correctGuildSupporter(userID.toString());

    const guilds = await (await getDB().guilds.find({})).toArray();
    expect(guilds).toEqual(getMockGuilds(mockguildsHasSupporters, user.blacklist));
  }

  // checking section one and two
  it("user no tier, no flags - should be removed from supporters", async () => {
    await guildSupporterTest(userWithout, discordBody(true), false);
  })

  it("user default tier, no flags - should be removed from supporters", async () => {
    await guildSupporterTest(userWithDefaultTier, discordBody(true), false);
  })

  it("user no tier, has flags - should be added to supporters", async () => {
    await guildSupporterTest(userWithFlags, discordBody(true), true);
  })

  it("user with tier, no flags - should be added to supporters", async () => {
    await guildSupporterTest(userWithTier, discordBody(true), true);
  })

  it("user with tier, has flags - should be added to supporters", async () => {
    await guildSupporterTest(userFull, discordBody(true), true);
  })

  it("user with tier, has flags - opted out - test one", async () => {
    await guildSupporterTest(userBlacklist, discordBody(true), true);
  })

  it("user with tier, has flags - opted out - test two", async () => {
    await guildSupporterTest(userBlacklistTwo, discordBody(true), true);
  })

  // user, guild in user and supporter, remove supporter if NO perms
  // user, guild in user and no supporter, do nothing if NO perms
  it("full user - no perms - has user guilds", async () => {
    await guildSupporterTest(userFull, discordBody(false), false);
  })

  // user, guild in user and supporter, do nothing if HAS perms
  // user, guild in user and no supporter, add supporter if HAS perms
  it("full user - has perms - has user guilds", async () => {
    await guildSupporterTest(userFull, discordBody(false), false);
  })

  // user, guild in no user and is supporter, remove supporter
  it("full user - no user guilds", async () => {
    await guildSupporterTest(userFull, { body: [] }, false);
  })
})
