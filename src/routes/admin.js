const express = require("express");
const router = express.Router();
const { sendResponse, hasKey } = require("../helpers/utils")

router.get("/test", hasKey, (req, res) => {
  sendResponse(res, {
    test: true
  });
});

router.post("/refresh", hasKey, (req, res) => {
  // IF patreon === true:
  // ---> get patreon data and store in patron collection
  //    > update user if patron doc has user attached
  // 1. loop over users
  // 1.1 for every user that has a flag or a tier, run a user update
  // 2. loop over guilds with supporters
  // 2.1 for every guild supporter that has no tier and no flag, remove from supporters
  sendResponse(res, {
    done: "done refresh"
  });
});

module.exports = router;
