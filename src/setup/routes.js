const adminRouter = require("../routes/admin");
const userRouter = require("../routes/user");
const userRouter = require("../routes/guild");
const webhookRouter = require("../routes/webhook");
const { send404 } = require("../helpers/utils");

function setupRoutes(app) {
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
