const { Long } = require("mongodb");
const { validateFlags } = require("../../helpers/flags");

function traversePath(obj, path) {
  if (!obj)
    return undefined;
  let parts = path.split(".");
  const key = parts.shift();
  if (parts.length == 0)
    return obj[key];
  return traversePath(obj[key], parts.join("."));
}

async function updateFlags(session, collection, path, id, query, { add, remove, clear }) {
  const longId = Long.fromString(id);
  const filterQuery = {
    ...query,
    _id: longId
  };
  let flags = [];

  if (!validateFlags(add))
    return false;

  if (clear !== true && add.length == 0 && remove.length == 0)
    return true;

  if (clear === true) {
    flags = add;
  }
  else {
    // get old flags
    let oldFlags = await collection.findOne(filterQuery, { session });
    if (!oldFlags)
      return false;

    flags = traversePath(oldFlags, path);

    // filter out every name in remove[] and add[]
    flags = flags.filter((val) => {
      if (remove.includes(val.name))
        return false;
      if (add.includes(val.name))
        return false;
      return true;
    });

    // add flags from add[]
    flags = [...flags, ...add];
  }

  // update db
  const updateQuery = {
    $set: {}
  };
  updateQuery.$set[path] = flags;
  const res = await collection.findOneAndUpdate(filterQuery, updateQuery, { session });

  if (!res)
    return false;
  return true;
}

module.exports = {
  updateFlags
}
