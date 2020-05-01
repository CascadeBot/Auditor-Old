const adminRouter = require("../routes/admin");
const userRouter = require("../routes/user");
const guildRouter = require("../routes/guild");
const webhookRouter = require("../routes/webhook");
const { send404 } = require("../helpers/utils");
const express = require("express");

function setupRoutes(app) {
  app.use(express.json());
  app.use("/", adminRouter);
  app.use("/user/:userid", userRouter);
  app.use("/guild/:guildid", guildRouter);
  app.use("/", webhookRouter);
  app.use((req, res, next) => {
    send404(res);
  });
}

module.exports = {
  setupRoutes,
};
