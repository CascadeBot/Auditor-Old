const { updateFlags } = require("../../src/logic/flags/updateflags");
const { Long } = require("mongodb");
const { setupDB, getDB } = require('../../src/setup/db');

/* mock user */
const userID = "1001234081234098213";
function makeMockUser({ longs, flags = [] }) {
  return {
    _id: longs ? Long.fromString(userID) : userID,
    accessToken: "access",
    refreshToken: "refresh",
    flags,
    patreon: {
      isLinkedPatreon: false,
      tier: "default"
    },
    supporting: [],
    blacklist: []
  }
}

/* mock data */
const flagsOne = [{
  name: "hello",
  scope: "guild"
}, {
  name: "world",
  scope: "user"
}]

const flagsOneName = ["hello", "world"];

const flagsTwo = [{
  name: "abc",
  scope: "guild"
}, {
  name: "def",
  scope: "user"
}]

const flagsTwoName = ["abc", "def"];

const flagsCombined = [...flagsOne, ...flagsTwo];
const flagsNameCombined = [...flagsOneName, ...flagsTwoName];

/* arguments */
function makeUserArgs(flags) {
  return [
    undefined,
    getDB().users,
    "flags",
    userID,
    {},
    flags
  ]
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

describe("updateFlags", () => {
  prepareDB();

  async function prepareUser(flags) {
    await getDB().users.insertOne(makeMockUser({
      longs: true,
      flags: [...flags]
    }));
  }

  async function runTest(one, { add = [], remove = [], clear = false}, out) {
    await prepareUser(one);
    await updateFlags(...makeUserArgs({
      add,
      remove,
      clear
    }));

    const user = await getDB().users.findOne({
      _id: Long.fromString(userID),
    });

    expect(user).toEqual(makeMockUser({ longs: true, flags: out}));
  }

  it('should add flags', async () => {
    await runTest(flagsOne, { add: flagsTwo }, flagsCombined);
  });

  it('should remove flags', async () => {
    await runTest(flagsOne, { remove: flagsOneName } , []);
  });

  it('should add and remove flags', async () => {
    await runTest(flagsOne, { add: flagsTwo, remove: flagsOneName } , [...flagsTwo]);
  });

  it('should add and clear flags', async () => {
    await runTest(flagsOne, { add: flagsTwo, clear: true } , [...flagsTwo]);
  });

  it('should clear flags', async () => {
    await runTest(flagsOne, { clear: true } , []);
  });
});
