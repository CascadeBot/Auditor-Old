const express = require("express");
const router = express.Router({mergeParams: true});
const { sendResponse, send404, hasKey, sendInvalid } = require("../helpers/utils");
const { userNotFoundError } = require("../helpers/errors");

const { updateGuildFlags } = require("../logic/flags/guild");

// json parse middleware
const bodyParser = require("body-parser");
router.use(bodyParser.json());

// api key check middleware
router.use(hasKey);

// execution handler
function executionHandler(next) {
  return async (req, res) => {
    try {
      const n = next(req, res);
      if (n instanceof Promise)
        await n;
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === userNotFoundError) {
          return send404(res);
        }
      }
      // TODO log errors properly
      console.log(e);
      return sendError(res);
    }

    sendResponse(res);
  };
}

router.patch("/flags", executionHandler(async (req, res) => {
  const { guildid } = req.params;
  if (!req.body || Object.keys(req.body).length == 0) return sendInvalid(res);
  let { add, remove, clear } = req.body

  if (!add) add = [];
  if (!remove) remove = [];

  // TODO validate add and remove

  if (add.length == 0 &&
    remove.length == 0 &&
    clear !== true)
    return sendResponse(res);

  await updateGuildFlags(guildid, clear, add, remove);
}));

module.exports = router;
