const express = require("express");
const router = express.Router({mergeParams: true});
const { Long } = require("mongodb");
const { sendResponse, send404, hasKey, sendInvalid } = require("../helpers/utils");
const { getDB } = require("../setup/db");

router.patch("/flags", hasKey, async (req, res) => {
  const { guildid } = req.params;
  if (!req.body || Object.keys(req.body).length == 0) return sendInvalid(res);
  let { add, remove, clear } = req.body

  if (!add) add = [];
  if (!remove) remove = [];

  const bulk = getDB().guilds.initializeOrderedBulkOp();
  let querycount = 0;
  if (clear === true) {
    bulk.find({
      _id: Long.fromString(guildid)
    }).updateOne({
      $set: {
        flags: add
      }
    });
    querycount = 1;
  } else {
    bulk.find({
      _id: Long.fromString(guildid)
    }).updateOne({
      $pullAll: {
        flags: remove
      }
    });
    bulk.find({
      _id: Long.fromString(guildid)
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
