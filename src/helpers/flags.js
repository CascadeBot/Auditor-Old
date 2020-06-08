const flagTypes = ["time", "amount"];
const flagDataType = {
  time: "number",
  amount: "number"
}
const flagScopes = ["user", "guild"];

/*
** flag rules:
**  - name must exist
**  - name must be string
**
**  - scope must exist
**  - scope must be string
**  - scope must be valid value
**
**  - type must be string if exists
**  - type must match data if exists
**  - type must be valid value
**
**  - data must match type if exists
**  - data object must not have any extra keys other than specified in type
**  - data must be object
**
**  - there must not be any extra keys on flag
*/

function validateFlag(flag) {
  // name
  if (typeof flag.name !== "string")
    return false;
  if (flag.name.length < 1)
    return false;

  // scope
  if (typeof flag.scope !== "string")
    return false;
  if (!flagScopes.includes(flag.scope))
    return false;

  // type and data
  if (typeof flag.type !== "string") {
    // type is not string, invalid if data and type are not undefined
    if (typeof flag.type !== "undefined" ||
      typeof flag.data !== "undefined")
      return false;
  } else {
    // type exists, data must be object
    if (!(flag.data instanceof Object))
      return false;

    // type must be valid value
    if (!flagTypes.includes(flag.type))
      return false;

    // must have one key
    let dataKeys = Object.keys(flag.data);
    if (dataKeys.length != 1)
      return false;
    // data must match type
    if (dataKeys[0] !== flag.type)
      return false;
    // data must be valid type
    if (typeof flag.data[dataKeys[0]] !== flagDataType[flag.type])
      return false;
  }

  // check for extra keys
  for (let key of Object.keys(flag)) {
    switch (key) {
      case "name":
      case "type":
      case "scope":
      case "data":
        continue;
      default:
        return false;
    }
  }

  return true;
}

function validateFlags(flags) {
  for (let flag of flags) {
    if (!validateFlag(flag))
      return false;
  }
  return true;
}

module.exports = {
  validateFlags,
  validateFlag
}
