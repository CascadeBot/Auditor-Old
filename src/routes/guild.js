const express = require("express");
const router = express.Router();
const { sendResponse, hasKey } = require("../helpers/utils")

router.patch("/flags", hasKey, (req, res) => {
  // 1. update flags, if no changes: exit
  sendResponse(res, {
    guild: req.params.guildid,
    done: "updated flags"
  });
});

module.exports = router;
