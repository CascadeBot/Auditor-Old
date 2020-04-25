const { getDB } = require('../../setup/db');
const { patreon: patreonConfig } = require('../../helpers/config');
const { getHighestTier, tierMap } = require('./tier');
const { correctGuildSupporter } = require('./supporter');
const crypto = require('crypto');

const events = [
  "members:create",
  "members:update",
  "members:delete",
  "members:pledge:create",
  "members:pledge:update",
  "members:pledge:delete"
]

function verifyWebhookSignature(signature, body) {
  const hmac = crypto.createHmac("md5", patreonConfig.webhook.secret);
  hmac.update(body);

  return hmac.digest("hex") === signature;
}

async function handleWebhookResponse(signature, event, rawdata, data) {
  if (!(event && signature && rawdata && data)) throw new Error("Missing params");
  if (!verifyWebhookSignature(signature, rawdata)) throw new Error("Signature invalid");
  if (!events.includes(event)) throw new Error("Event unsupported");
  if (!(data.relationships.currently_entitled_tiers.data &&
    data.relationships.user.data.id))
    throw new Error("Data structure invalid");

  const tiers = data.relationships.currently_entitled_tiers.data.map(({id}) => tierMap[id]);
  await getDB().patrons.findOneAndUpdate(
    { _id: data.relationships.user.data.id },
    {
      $set: {
        email: data.attributes.email,
        donationTotal: data.attributes.lifetime_support_cents,
        status: data.attributes.patron_status,
        tiers,
      }
    },
    {
      new: true,
      upsert: true
    }
  );

  let tier = getHighestTier(tiers);
  const user = await getDB().users.findOneAndUpdate(
    { "patreon.id": data.relationships.user.data.id },
    {
      $set: {
        'patreon.tier': tier
      }
    },
    {
      returnOriginal: false
    }
  );
  if (user.value) correctGuildSupporter(user.value._id.toString());
}

// test function
async function testWebhook(testnum) {
  if (testnum == 1)
    await handleWebhookResponse(true, "members:pledge:create", true, require("../../../tests/pledge-create.json").data);
  else if (testnum == 2)
    await handleWebhookResponse(true, "members:update", true, require("../../../tests/pledge-refund.json").data);
}

module.exports = {
  verifyWebhookSignature,
  handleWebhookResponse,
  correctGuildSupporter,
  testWebhook
};
