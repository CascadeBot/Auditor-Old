const express = require("express");
const app = express();
const { server: serverOptions } = require("./helpers/config");
const { setupDB } = require("./setup/db");
const { setupRoutes } = require("./setup/routes");

async function init() {
  await setupDB();
  setupRoutes(app);
  app.listen(serverOptions.port, () => {
    console.log(`Server is running on localhost:${serverOptions.port}`)
  });
}

init().catch((reason) => {
  console.error(reason);
});
