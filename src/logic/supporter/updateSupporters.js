function updateSupportersForGuilds(session, guildIds, userId, action) {
  // determine action
  let query = "";
  if (action === "add") query = "$addToSet";
  else if (action === "remove") query = "$pull";
  if (query === "") return false;

  // setup update query
  let updateField = {};
  updateField[query] = {
    supporters: Long.fromString(userId)
  }

  // execute query in session
  getDB().guilds.updateMany({
    _id: {
      $in: guildIds.map(id => Long.fromString(id))
    }
  }, updateField, {
    session,
  });
  return true;
}

function updateSupporting(session, userId, supporterUpdate) {
  if (supporterUpdate.toAdd.length > 0)
    updateSupportersForGuilds(session, userId, supporterUpdate.toAdd, "add");
  if (supportersUpdate.toRemove.length > 0)
    updateSupportersForGuilds(session, userId, supporterUpdate.toRemove, "remove");
}

module.exports = {
  updateSupporting,
  updateSupportersForGuilds
}
