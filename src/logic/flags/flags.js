const { Long } = require("../../setup/db");

// TODO filter out duplicate flags
async function updateFlags(collection, path, id, query, { add, remove, clear }) {
  const bulk = collection.initializeOrderedBulkOp();
  const longId = Long.fromString(id);
  const filterQuery = {
    ...query,
    _id: longId
  };

  const updateClearQuery = {$set: {}};
  updateClearQuery.$set[path] = add;

  const updateRemoveQuery = {$pullAll: {}};
  updateRemoveQuery.$pullAll[path] = remove;

  const updateAddQuery = {$addToSet: {}};
  updateAddQuery.$addToSet[path] = { $each: remove };

  let querycount = 0;
  if (clear === true) {
    bulk.find(filterQuery).updateOne(updateClearQuery);
    querycount++;
  } else {
    if (remove.length > 0) {
      bulk.find(filterQuery).updateOne(updateRemoveQuery);
      querycount++;
    }
    if (add.length > 0) {
      bulk.find(filterQuery).updateOne(updateAddQuery);
      querycount++;
    }
  }

  if (querycount == 0)
    return true;
  const bulkRes = await bulk.execute();
  if (bulkRes.nMatched != querycount) {
    return false;
  }
  return true;
}

module.exports = {
  updateFlags
}
