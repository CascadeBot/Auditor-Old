const { Long } = require("mongodb");
const { setupDB, getDB } = require("../../src/setup/db");
const { gatherGuilds } = require("../../src/logic/guilddata/update");

function makeMockUser(id, longs, supporting) {
  const out = {
    flags: ["FLAG"],
    tier: "default"
  };
  if (longs)
    out._id = Long.fromNumber(id);
  else
    out.id = id.toString();
  if (supporting)
    out.supporting = supporting.map(val => (longs ? Long.fromNumber(val) : val.toString()))
  return out;
}

function makeMockGuild(id, longs = false, supporters, flags = []) {
  const out = {
    flags
  };
  if (longs)
    out._id = Long.fromNumber(id);
  else
    out.id = id.toString();
  if (supporters)
    out.supporters = supporters.map((val) => makeMockUser(val, longs));
  return out;
}

function makeMockUsers(guildid, isId = false) {
  if (isId)
    return [201, 202, 204];
  return [
    makeMockUser(201, true, [guildid, 999]),
    makeMockUser(202, true, [guildid]),
    makeMockUser(203, true, []),
    makeMockUser(204, true, [guildid, 999]),
    makeMockUser(205, true, [999])
  ]
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
  })

  afterEach(async () => {
    await getDB().users.deleteMany({});
    await getDB().guilds.deleteMany({});
  })
}

describe('gatherGuilds', () => {
  prepareDB();

  it('should gather guilds', async () => {
    await getDB().users.insertMany(makeMockUsers(100));
    await getDB().guilds.insertOne(makeMockGuild(100, true, undefined, ["flags"]));

    const gathered = await gatherGuilds(undefined, ["100"]);
    expect(gathered).toStrictEqual({
      "100": makeMockGuild(100, false, makeMockUsers(100, true), ["flags"])
    });
  });

  it('should gather guild with no supporters', async () => {
    await getDB().guilds.insertOne(makeMockGuild(100, true, undefined, ["flags"]));

    const gathered = await gatherGuilds(undefined, ["100"]);
    expect(gathered).toStrictEqual({
      "100": makeMockGuild(100, false, [], ["flags"])
    });
  });

})
