// guild incorrect
const { getIncorrectSupportingFromUser } = require('../../src/logic/supporter/guildIncorrect');
const { userNotFoundError } = require("../../src/helpers/errors");
const { tierEnum } = require('../../src/models/patreon/tier');
const { setupDB, getDB } = require('../../src/setup/db');
const { Long } = require("mongodb");

/* mock discord request */
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

/* helper functions */
function longMaker(num, doLong) {
  if (num instanceof Array) {
    if (doLong)
      return num.map(v => Long.fromNumber(v));
      return num.map(v => v.toString());
  }
  if (doLong)
    return Long.fromNumber(num);
  return num.toString();
}

/* data */
const userNotExistID = 100;
const userID = 101;

const isSupport = [
  201,
  202
];

const noSupport = [
  211,
  212
];

/* make discord result */
const makeDiscordGuild = (id, hasperms = false) => ({
  id: id,
  permissions: hasperms ? 24 : 0
})

function discordBody({ hasPerms, hasGuilds }) {
  if (!hasGuilds)
    return { body: [] }
  return {
    body: [
      ...isSupport.map(id => makeDiscordGuild(id.toString(), hasPerms)),
      ...noSupport.map(id => makeDiscordGuild(id.toString(), hasPerms))
    ]
  }
}

/* make cascade user */
function makeMockUser({ longs, blacklist, hasTier, isLinked, supporting, flags }) {
  return {
    _id: longs ? Long.fromNumber(userID) : userID.toString(),
    accessToken: "access",
    refreshToken: "refresh",
    patreon: {
      isLinkedPatreon: isLinked,
      tier: hasTier ? tierEnum.hardcode : tierEnum.default
    },
    supporting: longMaker(supporting, longs),
    flags,
    blacklist: longMaker(blacklist, longs),
  }
}

/* make changelog*/
function makeChangelog(supporting, newSupporting) {
  supporting = supporting.map(v => v.toString());
  newSupporting = newSupporting.map(v => v.toString());

  let toAdd = newSupporting.filter(v => !supporting.includes(v));
  let toRemove = supporting.filter(v => !newSupporting.includes(v));
  let changedGuilds = [...toAdd, ...toRemove];
  let allGuilds = [...supporting, ...toAdd];
  return {
    allGuilds,
    changedGuilds,
    toRemove,
    toAdd
  }
}

/* setup database */
function prepareDB() {
  beforeAll(async () => {
    await setupDB(process.env.MONGO_URL, "jest")
  })

  afterAll(async () => {
    await getDB().users.deleteMany({});
    await getDB().guilds.deleteMany({});
    await getDB().rootClient.close();
  })

  afterEach(async () => {
    await getDB().users.deleteMany({});
    await getDB().guilds.deleteMany({});
  })
}

describe("getIncorrectSupportingFromUser", () => {
  prepareDB();

  const userDefaults = {
    longs: true,
    hasTier: false,
    isLinked: true,
    flags: [],
    blacklist: []
  }

  async function guildSupporterTest(user, body, changelog, log = false) {
    if (log)
      console.log("--=--");
    await getDB().users.insertOne(user);
    mockGetUserGuilds.mockResolvedValue(body);

    const out = await getIncorrectSupportingFromUser(undefined, userID.toString());
    if (log)
      console.log(out, changelog);
    if (log)
      console.log("--=--");
    expect(out).toEqual(changelog);
  }

  // basic tests
  it("throws error when user doesn't exist", async () => {
    expect(getIncorrectSupportingFromUser(undefined, userNotExistID.toString()))
      .rejects.toEqual(new Error(userNotFoundError))
  })

  // basic functionality
  it("user no tier, no flags - should have supporting cleared", async () => {
    let supporting = [...isSupport];
    await guildSupporterTest(
      makeMockUser({
        ...userDefaults,
        isLinked: false,
        supporting
      }),
      discordBody({
        hasPerms: true,
        hasGuilds: true
      }),
      makeChangelog(supporting, [])
    );
  })

  it("user default tier, no flags - should have supporting cleared", async () => {
    let supporting = [...isSupport];
    await guildSupporterTest(
      makeMockUser({
        ...userDefaults,
        supporting
      }),
      discordBody({
        hasPerms: true,
        hasGuilds: true
      }),
      makeChangelog(supporting, [])
    );
  })

  it("user no tier, has flags - should have supporting added", async () => {
    let supporting = [...isSupport];
    await guildSupporterTest(
      makeMockUser({
        ...userDefaults,
        flags: ["FLAG"],
        supporting
      }),
      discordBody({
        hasPerms: true,
        hasGuilds: true
      }),
      makeChangelog(supporting, [...isSupport, ...noSupport])
    );
  })

  it("user with tier, no flags - should have supporting added", async () => {
    let supporting = [...isSupport];
    await guildSupporterTest(
      makeMockUser({
        ...userDefaults,
        hasTier: true,
        supporting
      }),
      discordBody({
        hasPerms: true,
        hasGuilds: true
      }),
      makeChangelog(supporting, [...isSupport, ...noSupport])
    );
  })

  it("user with tier, has flags - should have supporting added", async () => {
    let supporting = [...isSupport];
    await guildSupporterTest(
      makeMockUser({
        ...userDefaults,
        hasTier: true,
        flags: ["FLAG"],
        supporting
      }),
      discordBody({
        hasPerms: true,
        hasGuilds: true
      }),
      makeChangelog(supporting, [...isSupport, ...noSupport])
    );
  })

  // blacklist tests
  it("user with tier, has flags - should have supporting added except for blacklisted", async () => {
    let supporting = [...isSupport];
    await guildSupporterTest(
      makeMockUser({
        ...userDefaults,
        hasTier: true,
        flags: ["FLAG"],
        supporting,
        blacklist: [...noSupport]
      }),
      discordBody({
        hasPerms: true,
        hasGuilds: true
      }),
      makeChangelog(supporting, [...isSupport])
    );
  })

  it("user with tier, has flags - should have supporting added and blacklisted removed", async () => {
    let supporting = [...isSupport];
    await guildSupporterTest(
      makeMockUser({
        ...userDefaults,
        hasTier: true,
        flags: ["FLAG"],
        supporting,
        blacklist: [...isSupport]
      }),
      discordBody({
        hasPerms: true,
        hasGuilds: true
      }),
      makeChangelog(supporting, [...noSupport])
    );
  })

  // permission checks
  it("full user - no perms - has user guilds - should clear supporting", async () => {
    let supporting = [...isSupport];
    await guildSupporterTest(
      makeMockUser({
        ...userDefaults,
        hasTier: true,
        flags: ["FLAG"],
        supporting
      }),
      discordBody({
        hasPerms: false,
        hasGuilds: true
      }),
      makeChangelog(supporting, [])
    );
  })

  it("full user - has perms - has user guilds - should add supporting", async () => {
    let supporting = [...isSupport];
    await guildSupporterTest(
      makeMockUser({
        ...userDefaults,
        hasTier: true,
        flags: ["FLAG"],
        supporting
      }),
      discordBody({
        hasPerms: true,
        hasGuilds: true
      }),
      makeChangelog(supporting, [...isSupport, ...noSupport])
    );
  })

  it("full user - has no guilds - should clear supporting", async () => {
    let supporting = [...isSupport];
    await guildSupporterTest(
      makeMockUser({
        ...userDefaults,
        hasTier: true,
        flags: ["FLAG"],
        supporting
      }),
      discordBody({
        hasPerms: false,
        hasGuilds: false
      }),
      makeChangelog(supporting, [])
    );
  })
});
