const { apikey } = require("./config");

function send404(res) {
  res.status(404).json({
    code: 404,
    success: false,
    error: "Not found"
  });
}

function send401(res) {
  res.status(401).json({
    code: 401,
    success: false,
    error: "Not authorized"
  });
}

function sendInvalid(res) {
  res.status(400).json({
    code: 400,
    success: false,
    error: "Invalid request"
  });
}

function hasKey(req, res, next) {
  if (req.headers["Authorization"]) {
    if (req.headers["Authorization"] === `Bearer ${apikey}`)
      return next();
  }
  return send401(res);
}

function sendError(res, err) {
  res.status(500).json({
    code: 500,
    success: false,
    error: err ? err : "Internal server error"
  })
}

function sendResponse(res, data) {
  res.json({
    code: 200,
    success: true,
    data,
  })
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

module.exports = {
  send404,
  send401,
  sendInvalid,
  sendError,
  sendResponse,
  hasKey,
  isProduction
};
