const { getDB } = require("../../setup/db");
const { userNotFoundError } = require("../../helpers/errors");
const { getHighestTier, tierEnum } = require("../../models/patreon/tier");
const { Long } = require("mongodb");

async function updatePatreonTier(session, patreonId, userId) {
  let patron = await getDB().patrons.findOne(
    { _id: patreonId },
    { session }
  );

  let isLinked = true;
  if (!patron) {
    patron = {
      tiers: []
    };
    isLinked = false;
    patreonId = "";
  }
  const tier = getHighestTier(patron.tiers);
  const user = await getDB().users.findOneAndUpdate(
    { _id: Long.fromString(userId) },
    {
      $set: {
        'patreon.id': patreonId,
        'patreon.isLinkedPatreon': isLinked,
        'patreon.tier': tier
      }
    },
    { session }
  );
  if (!user.value)
    throw new Error(userNotFoundError);
  return tier;
}

async function unlinkPatreon(session, userId) {
  const user = await getDB().users.findOneAndUpdate(
    { _id: Long.fromString(userId) },
    {
      $unset: {
        'patreon.id': "",
        'patreon.access_token': "",
        'patreon.refresh_token': ""
      },
      $set: {
        'patreon.isLinkedPatreon': false,
        'patreon.tier': tierEnum.default
      }
    },
    { session }
  );

  if (!user.value)
    throw new Error(userNotFoundError);
  return true;
}

module.exports = {
  updatePatreonTier,
  unlinkPatreon
};
