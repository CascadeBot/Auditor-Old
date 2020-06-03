const express = require("express");
const router = express.Router({mergeParams: true});
const { sendResponse, send404, hasKey, sendInvalid, sendError } = require("../helpers/utils");
const { getDB } = require("../setup/db");
const { Long } = require("mongodb");
const { correctGuildSupporter, userNotFoundError } = require("../models/patreon/supporter");
const { getHighestTier, tierEnum } = require("../models/patreon/tier");

const bodyParser = require("body-parser");
router.use(bodyParser.json());
router.use(hasKey);

router.post("/link/:patreonid", async (req, res) => {
  const { userid, patreonid } = req.params;

  if (!userid || !patreonid) {
    return sendInvalid(res);
  }

  try {
    let patron = await getDB().patrons.findOne(
      { _id: patreonid }
    );

    if (!patron) {
      patron = {};
      patron.tiers = [];
    }
    const tier = getHighestTier(patron.tiers);
    const user = await getDB().users.findOneAndUpdate(
      { _id: Long.fromString(userid) },
      {
        $set: {
          'patreon.tier': tier
        }
      }
    );
    if (!user.value) {
      return send404(res);
    }
    await correctGuildSupporter(userid);
  } catch (e) {
    console.log(e);
    return sendError(res);
  }
  sendResponse(res);
});

router.post("/unlink", async (req, res) => {
  const { userid } = req.params;

  if (!userid) {
    return sendInvalid(res);
  }

  try {
    const user = await getDB().users.findOneAndUpdate(
      { _id: Long.fromString(userid) },
      {
        $set: {
          'patreon.isLinkedPatreon': false,
          'patreon.tier': tierEnum.default
        }
      }
    );
    if (!user.value) {
      return send404(res);
    }
    await correctGuildSupporter(userid);
  } catch (e) {
    return sendError(res);
  }
  sendResponse(res);
});

router.post("/update", async (req, res) => {
  try {
    await correctGuildSupporter(req.params.userid);
  } catch (e) {
    if (e === userNotFoundError) {
      return send404(res);
    }
    return sendError(res);
  }
  sendResponse(res);
});

router.delete("/guilds/:guildid", async (req, res) => {
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
  if (!oldUser || oldUser.value === null) {
    return send404(res);
  }
  try {
    await correctGuildSupporter(userid)
  } catch (e) {
    return sendError(res);
  }
  sendResponse(res);
});

router.post("/guilds/:guildid", async (req, res) => {
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
  if (!oldUser || oldUser.value === null) {
    return send404(res);
  }
  try {
    await correctGuildSupporter(userid)
  } catch (e) {
    return sendError(res);
  }
  sendResponse(res);
});

router.patch("/flags", async (req, res) => {
  // TODO gifting system
  const { userid } = req.params;
  if (!req.body || Object.keys(req.body).length == 0) return sendInvalid(res);
  let { add, remove, clear } = req.body

  if (!add) add = [];
  if (!remove) remove = [];

  const bulk = getDB().users.initializeOrderedBulkOp();
  let querycount = 0;
  if (clear === true) {
    bulk.find({
      _id: Long.fromString(userid),
      accessToken: {
        $exists: true
      }
    }).updateOne({
      $set: {
        flags: add
      }
    });
    querycount = 1;
  } else {
    bulk.find({
      _id: Long.fromString(userid),
      accessToken: {
        $exists: true
      }
    }).updateOne({
      $pullAll: {
        flags: remove
      }
    });
    bulk.find({
      _id: Long.fromString(userid),
      accessToken: {
        $exists: true
      }
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
  try {
    // TODO if modlog flag gets changed, force modlog
    await correctGuildSupporter(userid)
  } catch (e) {
    return sendError(res);
  }
  sendResponse(res);
});

module.exports = router;
