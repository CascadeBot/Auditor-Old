const express = require("express");
const router = express.Router();
const Patreon = require('../models/patreon');
const { sendInvalid, sendResponse } = require("../helpers/utils")

const bodyParser = require("body-parser");
const getRaw = bodyParser.json({
  verify: (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  }
});

router.post('/webhook/' + patreonConfig.webhook.identifier, hasKey, getRaw, async (req, res) => {
  if (req.get("X-Patreon-Signature") &&
    req.get("X-Patreon-Event")) {
    await Patreon.handleWebhookResponse(
      req.get("X-Patreon-Signature"),
      req.get("X-Patreon-Event"),
      req.rawBody,
      req.body.data
    );
    return sendResponse(res);
  }
  return sendInvalid(res);
});
