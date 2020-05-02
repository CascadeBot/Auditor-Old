const express = require("express");
const supertest = require('supertest');
const { Long } = require("mongodb");
const { apikey } = require("../../src/helpers/config");

const { setupRoutes } = require("../../src/setup/routes");
const { setupDB, getDB } = require('../../src/setup/db');

jest.mock("../../src/models/patreon/supporter", () => {
  const err = new Error("user not found");
  return {
    userNotFoundError: err,
    correctGuildSupporter: jest.fn().mockImplementation((userid) => {
      return new Promise((resolve, reject) => {
        if (userid === "567")
          return reject(err);
        resolve(true);
      });
    })
  }
});

const { correctGuildSupporter: mockCorrectGuildSupporter } = require("../../src/models/patreon/supporter");

const app = express();
setupRoutes(app);

function getMockUser(blacklist, long) {
  if (!blacklist) blacklist = [];
  blacklist = blacklist.map(id => {
    if (long)
      return Long.fromNumber(id)
    return id;
  });
  return {
    _id: long === true ? Long.fromString("123") : 123,
    blacklist,
    accessToken: "abc",
    flags: ["FLAG"],
  };
}

const mockUsers = [getMockUser([123], true)];

function prepareDB() {
  beforeEach(async () => {
    await getDB().users.insertMany(mockUsers);
  });

  beforeAll(async () => {
    await setupDB(process.env.MONGO_URL, "jest");
    mockCorrectGuildSupporter.mockClear()
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

async function checkUser(expected) {
  const user = await getDB().users.findOne({
    _id: Long.fromString("123")
  });

  expect(user).toEqual(expected);
}

describe('user update', () => {
  prepareDB();

  it('Should throw 404', async () => {
    const res = await supertest(app).post("/user/567/update")
      .set("Authorization", "Bearer " + apikey);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      code: 404,
      success: false,
      error: "Not found"
    });

    expect(mockCorrectGuildSupporter).toBeCalled();
  });

  it('Should update', async () => {
    const res = await supertest(app).post("/user/123/update")
      .set("Authorization", "Bearer " + apikey);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      success: true
    });

    expect(mockCorrectGuildSupporter).toBeCalled();
  });
});

describe('user opt out', () => {
  prepareDB();

  it('Should throw 404', async () => {
    const res = await supertest(app).delete("/user/567/guilds/123")
      .set("Authorization", "Bearer " + apikey);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      code: 404,
      success: false,
      error: "Not found"
    });

    expect(mockCorrectGuildSupporter).not.toBeCalled();
  });

  it('Should blacklist guild', async () => {
    const res = await supertest(app).delete("/user/123/guilds/567")
      .set("Authorization", "Bearer " + apikey);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      success: true
    });

    await checkUser(getMockUser([123, 567]));
    expect(mockCorrectGuildSupporter).toBeCalled();
  });

  it('Should not add duplicates', async () => {
    const res = await supertest(app).delete("/user/123/guilds/123")
      .set("Authorization", "Bearer " + apikey);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      success: true
    });

    await checkUser(getMockUser([123]));
    expect(mockCorrectGuildSupporter).toBeCalled();
  });
});

describe('user opt back in', () => {
  prepareDB();

  it('Should throw 404', async () => {
    const res = await supertest(app).post("/user/567/guilds/123")
      .set("Authorization", "Bearer " + apikey);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      code: 404,
      success: false,
      error: "Not found"
    });

    expect(mockCorrectGuildSupporter).not.toBeCalled();
  });

  it('Should remove guild from blacklist', async () => {
    const res = await supertest(app).post("/user/123/guilds/123")
      .set("Authorization", "Bearer " + apikey);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      success: true
    });

    await checkUser(getMockUser([]));
    expect(mockCorrectGuildSupporter).toBeCalled();
  });

  it('Should not modify nonexisting guild', async () => {
    const res = await supertest(app).post("/user/123/guilds/567")
      .set("Authorization", "Bearer " + apikey);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      success: true
    });

    await checkUser(getMockUser([123]));
    expect(mockCorrectGuildSupporter).toBeCalled();
  });
});
