const express = require("express");
const supertest = require('supertest');
const { Long } = require("mongodb");
const { apikey } = require("../../src/helpers/config");

const { setupRoutes } = require("../../src/setup/routes");
const { setupDB, getDB } = require('../../src/setup/db');

jest.mock("../../src/models/patreon/supporter", () => {
  return {
    correctGuildSupporter: jest.fn().mockImplementation(() => {
      return new Promise((resolve, reject) => {
        resolve(true);
      });
    })
  }
});

const { correctGuildSupporter: mockCorrectGuildSupporter } = require("../../src/models/patreon/supporter");

const app = express();
setupRoutes(app);

function getMockGuild(flagone, flagtwo, long) {
  const flags = [];
  if (flagone) flags.push("FLAG");
  if (flagtwo) flags.push("FLAGTWO");
  return {
    _id: long === true ? Long.fromString("123") : 123,
    flags,
  };
}

function getMockUser(flagone, flagtwo, long, noToken) {
  const flags = [];
  if (flagone) flags.push("FLAG");
  if (flagtwo) flags.push("FLAGTWO");
  const out = {
    _id: long === true ? Long.fromString("123") : 123,
    blacklist: [],
    flags,
  };
  if (!noToken) out.accessToken = "abcdefg";
  return out;
}

const mockGuilds = [getMockGuild(true, false, true)];
const mockUsers = [getMockUser(true, false, true)];

function prepareDB() {
  beforeEach(async () => {
    await getDB().guilds.insertMany(mockGuilds);
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

async function checkGuild(expected) {
  const guild = await getDB().guilds.findOne({
    _id: Long.fromString("123")
  });

  expect(guild).toEqual(expected);
}

async function checkUser(expected) {
  const user = await getDB().users.findOne({
    _id: Long.fromString("123")
  });

  expect(user).toEqual(expected);
}

function allTests(path, mockFunc, checker, checkUpdate) {
  it('Should throw 400', async () => {
    const res = await supertest(app).patch(path)
      .set("Authorization", "Bearer " + apikey);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      code: 400,
      success: false,
      error: "Invalid request"
    });

    await checker(mockFunc(true));
    expect(mockCorrectGuildSupporter).not.toBeCalled();
  });

  it('Should throw 404', async () => {
    const res = await supertest(app).patch('/guild/567/flags')
      .set("Authorization", "Bearer " + apikey)
      .send({
        add: ["FLAGTWO"]
      });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      code: 404,
      success: false,
      error: "Not found"
    });

    await checker(mockFunc(true));
    expect(mockCorrectGuildSupporter).not.toBeCalled();
  });

  it('Should add flag', async () => {
    const res = await supertest(app).patch(path)
      .set("Authorization", "Bearer " + apikey)
      .send({
        add: ["FLAGTWO"]
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      success: true
    });

    await checker(mockFunc(true, true));

    if (checkUpdate)
      expect(mockCorrectGuildSupporter).toBeCalled();
    else
      expect(mockCorrectGuildSupporter).not.toBeCalled();
  });

  it('Should remove flag', async () => {
    const res = await supertest(app).patch(path)
      .set("Authorization", "Bearer " + apikey)
      .send({
        remove: ["FLAG"]
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      success: true
    });

    await checker(mockFunc());

    if (checkUpdate)
      expect(mockCorrectGuildSupporter).toBeCalled();
    else
      expect(mockCorrectGuildSupporter).not.toBeCalled();
  });

  it('Should add and remove flag', async () => {
    const res = await supertest(app).patch(path)
      .set("Authorization", "Bearer " + apikey)
      .send({
        remove: ["FLAG"],
        add: ["FLAGTWO"]
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      success: true
    });

    await checker(mockFunc(false, true));

    if (checkUpdate)
      expect(mockCorrectGuildSupporter).toBeCalled();
    else
      expect(mockCorrectGuildSupporter).not.toBeCalled();
  });

  it('Should clear flags', async () => {
    const res = await supertest(app).patch(path)
      .set("Authorization", "Bearer " + apikey)
      .send({
        clear: true
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      success: true
    });

    await checker(mockFunc());

    if (checkUpdate)
      expect(mockCorrectGuildSupporter).toBeCalled();
    else
      expect(mockCorrectGuildSupporter).not.toBeCalled();
  });

  it('Should clear flags and add', async () => {
    const res = await supertest(app).patch(path)
      .set("Authorization", "Bearer " + apikey)
      .send({
        clear: true,
        add: ["FLAGTWO"]
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      success: true
    });

    await checker(mockFunc(false, true));

    if (checkUpdate)
      expect(mockCorrectGuildSupporter).toBeCalled();
    else
      expect(mockCorrectGuildSupporter).not.toBeCalled();
  });
}

describe('guild flags', () => {
  prepareDB();

  allTests("/guild/123/flags", getMockGuild, checkGuild);
});

describe('user flags', () => {
  prepareDB();


  it('Should throw 404 because no accesstoken', async () => {
    await getDB().users.findOneAndUpdate({
      _id: Long.fromString("123")
    }, {
      $unset: {
        accessToken: true
      }
    });
    const res = await supertest(app).patch("/user/123/flags")
      .set("Authorization", "Bearer " + apikey)
      .send({
        add: ["FLAGTWO"]
      });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      code: 404,
      success: false,
      error: "Not found"
    });

    await checkUser(getMockUser(true, false, false, true));
    expect(mockCorrectGuildSupporter).not.toBeCalled();
  });

  allTests("/user/123/flags", getMockUser, checkUser, true);
});
