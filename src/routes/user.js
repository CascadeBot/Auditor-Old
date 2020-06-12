const express = require("express");
const router = express.Router({mergeParams: true});
const { sendResponse, send404, hasKey, sendInvalid, sendError } = require("../helpers/utils");
const { userNotFoundError } = require("../helpers/errors");

const { updateGuildSupporter } = require("../logic/supporter/guildSupporter");
const { updatePatreonTier, unlinkPatreon } = require("../logic/patreon/linking");
const { addToBlacklist, removeFromBlacklist } = require("../logic/user/blacklist");
const { updateUserFlags } = require("../logic/flags/user");

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

router.patch("/updatetier/:patreonid", executionHandler(async (req, res) => {
  const { userid, patreonid } = req.params;

  if (!userid || !patreonid) {
    return sendInvalid(res);
  }

  // TODO optimisation, only trigger update when tier got updated
  await updateGuildSupporter(userid, async (session) => {
    return await updatePatreonTier(session, patreonid, userid);
  }, true)
}));

router.post("/unlink", executionHandler(async (req, res) => {
  const { userid } = req.params;

  if (!userid) {
    return sendInvalid(res);
  }

  // TODO optimisation, only trigger update when tier got updated
  await updateGuildSupporter(userid, async (session, uid) => {
    return await unlinkPatreon(session, uid);
  }, true)
}));

router.post("/update", executionHandler(async (req, res) => {
  const { userid } = req.params;

  if (!userid) {
    return sendInvalid(res);
  }

  await updateGuildSupporter(userid, undefined, false);
}));

router.delete("/guilds/:guildid", executionHandler(async (req, res) => {
  const { userid, guildid } = req.params

  if (!userid || !guildid) {
    return sendInvalid(res);
  }

  await addToBlacklist(undefined, userid, guildid);
}));

router.post("/guilds/:guildid", executionHandler(async (req, res) => {
  const { userid, guildid } = req.params

  if (!userid || !guildid) {
    return sendInvalid(res);
  }

  await updateGuildSupporter(userid, async (session) => {
    return await removeFromBlacklist(session, userid, guildid);
  }, false)
}));

router.patch("/flags", executionHandler(async (req, res) => {
  // TODO gifting system
  const { userid } = req.params;
  if (!req.body || Object.keys(req.body).length == 0) return sendInvalid(res);
  let { add, remove, clear } = req.body

  if (!add) add = [];
  if (!remove) remove = [];

  // TODO validate add and remove

  if (add.length == 0 &&
    remove.length == 0 &&
    clear !== true)
    return sendResponse(res);

  await updateUserFlags(userid, clear, add, remove);
}));

module.exports = router;
