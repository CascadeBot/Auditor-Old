const express = require("express");
const supertest = require('supertest');
const { Long } = require("mongodb");
const { apikey } = require("../../src/helpers/config");
const { tierEnum } = require("../../src/models/patreon/tier");

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

const patrons = [{
  _id: "1234",
  tiers: [tierEnum.default, tierEnum.medium]
}, {
  _id: "2345",
  tiers: [tierEnum.default, tierEnum.hardcode]
}, {
  _id: "3456",
  tiers: [tierEnum.default]
}];

function getMockUser(tier, long, linked) {
  return {
    _id: long === true ? Long.fromString("123") : 123,
    accessToken: "abc",
    patreon: {
      isLinkedPatreon: (typeof linked !== "undefined") ? !!linked : true,
      tier: tier ? tier : tierEnum.default
    }
  };
}

const mockUsers = [getMockUser(tierEnum.default, true)];

function prepareDB() {
  beforeEach(async () => {
    await getDB().users.insertMany(mockUsers);
    await getDB().patrons.insertMany(patrons);
  });

  beforeAll(async () => {
    await setupDB(process.env.MONGO_URL, "jest");
    mockCorrectGuildSupporter.mockClear()
  })

  afterAll(async () => {
    await getDB().rootClient.close();
  })

  afterEach(async () => {
    await getDB().users.deleteMany({});
    await getDB().patrons.deleteMany({});
  })
}

async function checkUser(expected) {
  const user = await getDB().users.findOne({
    _id: Long.fromString("123")
  });

  expect(user).toEqual(expected);
}

describe('user linking', () => {
  prepareDB();

  it('Should throw 404', async () => {
    const res = await supertest(app).post("/user/567/link/1234")
      .set("Authorization", "Bearer " + apikey);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      code: 404,
      success: false,
      error: "Not found"
    });

    expect(mockCorrectGuildSupporter).not.toBeCalled();
  });

  it('Should link and set tier to medium', async () => {
    const res = await supertest(app).post("/user/123/link/1234")
      .set("Authorization", "Bearer " + apikey);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      success: true
    });

    await checkUser(getMockUser(tierEnum.medium));
    expect(mockCorrectGuildSupporter).toBeCalled();
  });

  it('Should link and set tier to hardcode', async () => {
    const res = await supertest(app).post("/user/123/link/2345")
      .set("Authorization", "Bearer " + apikey);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      success: true
    });

    await checkUser(getMockUser(tierEnum.hardcode));
    expect(mockCorrectGuildSupporter).toBeCalled();
  });

  it('Should link and set tier to default', async () => {
    const res = await supertest(app).post("/user/123/link/3456")
      .set("Authorization", "Bearer " + apikey);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      success: true
    });

    await checkUser(getMockUser(tierEnum.default));
    expect(mockCorrectGuildSupporter).toBeCalled();
  });

  it('Should link and set tier to default', async () => {
    const res = await supertest(app).post("/user/123/link/99999")
      .set("Authorization", "Bearer " + apikey);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      success: true
    });

    await checkUser(getMockUser(tierEnum.default));
    expect(mockCorrectGuildSupporter).toBeCalled();
  });
});

describe('user unlinking', () => {
  prepareDB();

  it('Should throw 404', async () => {
    const res = await supertest(app).post("/user/567/unlink")
      .set("Authorization", "Bearer " + apikey);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      code: 404,
      success: false,
      error: "Not found"
    });

    expect(mockCorrectGuildSupporter).not.toBeCalled();
  });

  it('Should unlink', async () => {
    const resu = await getDB().users.findOneAndUpdate({
      _id: Long.fromString("123")
    }, {
      $set: { 'patreon.tier': tierEnum.hardcode }
    })
    if (!resu.value) throw new Error("something went wrong, db is fucked");

    const res = await supertest(app).post("/user/123/unlink")
      .set("Authorization", "Bearer " + apikey);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      success: true
    });

    await checkUser(getMockUser(tierEnum.default, false, false));
    expect(mockCorrectGuildSupporter).toBeCalled();
  });
});
