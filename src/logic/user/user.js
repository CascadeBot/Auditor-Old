const userNullError = new Error("user cannot be null");

// TODO only check guild scope
function hasGuildFlags(user) {
  if (!user) throw userNullError;
  if (!user.flags) return false;
  if (user.flags.length === 0) return false;
  return true;
}

function hasPatreonLinked(user) {
  if (!user) throw userNullError;
  if (!user.patreon) return false;
  if (!user.patreon.isLinkedPatreon) return false;
  return true;
}

function getTier(user) {
  if (!user) throw userNullError;
  if (!hasPatreonLinked(user)) return tierEnum.default;
  if (!user.patreon.tier) return tierEnum.default;
  return user.patreon.tier;
}

module.exports = {
  hasGuildFlags,
  hasPatreonLinked,
  getTier
}
