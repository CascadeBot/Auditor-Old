const express = require("express");
const supertest = require('supertest');
const { Long } = require("mongodb");
const { apikey } = require("../src/helpers/config");

const { setupRoutes } = require("../src/setup/routes");
const { setupDB, getDB } = require('../src/setup/db');

const app = express();
setupRoutes(app);

const mockGuildNoFlags = {
  _id: 123,
  flags: []
}

const mockGuildTwoFlags = {
  _id: 123,
  flags: ["FLAG", "FLAGTWO"]
}

const mockGuildOtherFlag = {
  _id: 123,
  flags: ["FLAGTWO"]
}

const mockGuildFlag = {
  _id: 123,
  flags: ["FLAG"]
}

const mockGuilds = [{
  _id: 123,
  flags: ["FLAG"]
}];

function prepareDB() {
  beforeEach(async () => {
    await getDB().guilds.insertMany(mockGuilds);
  });

  beforeAll(async () => {
    await setupDB(process.env.MONGO_URL, "jest");
  })

  afterAll(async () => {
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

describe('guild flags', () => {
  prepareDB();

  it('Should throw 400', async () => {
    const res = await supertest(app).patch('/guild/123/flags')
      .set("Authorization", "Bearer " + apikey);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      code: 400,
      success: false,
      error: "Invalid request"
    });

    checkGuild(mockGuildFlag);
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

    checkGuild(mockGuildFlag);
  });

  it('Should add flag', async () => {
    const res = await supertest(app).patch('/guild/123/flags')
      .set("Authorization", "Bearer " + apikey)
      .send({
        add: ["FLAGTWO"]
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      success: true
    });

    await checkGuild(mockGuildTwoFlags);
  });

  it('Should remove flag', async () => {
    const res = await supertest(app).patch('/guild/123/flags')
      .set("Authorization", "Bearer " + apikey)
      .send({
        remove: ["FLAG"]
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      success: true
    });

    await checkGuild(mockGuildNoFlags);
  });

  it('Should add and remove flag', async () => {
    const res = await supertest(app).patch('/guild/123/flags')
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

    await checkGuild(mockGuildOtherFlag);
  });

  it('Should clear flags', async () => {
    const res = await supertest(app).patch('/guild/123/flags')
      .set("Authorization", "Bearer " + apikey)
      .send({
        clear: true
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      success: true
    });

    await checkGuild(mockGuildNoFlags);
  });

  it('Should clear flags and add', async () => {
    const res = await supertest(app).patch('/guild/123/flags')
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

    await checkGuild(mockGuildOtherFlag);
  });
});
