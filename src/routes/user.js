const express = require("express");
const router = express.Router();
const { sendResponse, hasKey } = require("../helpers/utils")

const bodyParser = require("body-parser");
router.use(bodyParser.json());

router.post("/update", hasKey, (req, res) => {
  // 1. update user
  sendResponse(res, {
    user: req.params.userid,
    done: "updating"
  });
});

router.delete("/guilds/:guildid", hasKey, (req, res) => {
  // 1. add guild to blacklist, if already in blacklist: exit
  // 2. update user
  sendResponse(res, {
    user: req.params.userid,
    guild: req.params.guildid,
    done: "deleting guild"
  });
});

router.post("/guilds/:guildid", hasKey, (req, res) => {
  // 1. remove guild blacklist, if not in blacklist: exit
  // 2. update user
  sendResponse(res, {
    user: req.params.userid,
    guild: req.params.guildid,
    done: "adding guild"
  });
});

router.patch("/flags", hasKey, (req, res) => {
  // 1. update flags, if no changes: exit
  // 2. update user
  sendResponse(res, {
    user: req.params.userid,
    done: "updated flags"
  });
});

module.exports = router;
