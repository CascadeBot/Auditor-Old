const express = require("express");
const router = express.Router();
const { sendResponse, send404, hasKey } = require("../helpers/utils");
const { Long } = require("mongodb");

const bodyParser = require("body-parser");
router.use(bodyParser.json());

router.post("/update", hasKey, async (req, res) => {
  try {
    await correctGuildSupporter(userid);
  } catch (e) {
    return sendError(res);
  }
  sendResponse(res);
});

router.delete("/guilds/:guildid", hasKey, async (req, res) => {
  const { userid, guildid } = req.params

  if (!userid || !guildid) {
    return sendInvalid(res);
  }
  const oldUser = await getDB().users.findOneAndUpdate({
    _id: Long.fromString(userid)
  }, {
    $addToSet: {
      blacklist: Long.fromString(guildid)
    }
  });
  if (!oldUser) {
    return send404(res);
  }
  try {
    await correctGuildSupporter(userid)
  } catch (e) {
    return sendError(res);
  }
  sendResponse(res);
});

router.post("/guilds/:guildid", hasKey, async (req, res) => {
  const { userid, guildid } = req.params

  if (!userid || !guildid) {
    return sendInvalid(res);
  }
  const oldUser = await getDB().users.findOneAndUpdate({
    _id: Long.fromString(userid)
  }, {
    $pull: {
      blacklist: Long.fromString(guildid)
    }
  });
  if (!oldUser) {
    return send404(res);
  }
  try {
    await correctGuildSupporter(userid)
  } catch (e) {
    return sendError(res);
  }
  sendResponse(res);
});

router.patch("/flags", hasKey, async (req, res) => {
  // TODO make sure it logged into dashboard
  const { userid } = req.params;
  if (!req.body || Object.keys(req.body).length == 0) return sendInvalid(res);
  let { add, remove, clear } = req.body

  if (!add) add = [];
  if (!remove) remove = [];

  const bulk = getDB().users.initializeOrderedBulkOp();
  let querycount = 0;
  if (clear === true) {
    bulk.find({
      _id: Long.fromString(userid)
    }).updateOne({
      $set: {
        flags: add
      }
    });
    querycount = 1;
  } else {
    bulk.find({
      _id: Long.fromString(userid)
    }).updateOne({
      $pullAll: {
        flags: remove
      }
    });
    bulk.find({
      _id: Long.fromString(userid)
    }).updateOne({
      $addToSet: {
        flags: {
          $each: add
        }
      }
    });
    querycount = 2;
  }
  const bulkRes = await bulk.execute();
  if (bulkRes.nMatched != querycount) {
    return send404(res);
  }
  sendResponse(res);
});

module.exports = router;
