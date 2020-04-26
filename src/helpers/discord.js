const permissionsMap = {
  "ADMINISTRATOR": 0x8,
  "MANAGE_GUILD": 0x20
};

function hasPermission(permissions, perm) {
  if (typeof permissionsMap[perm] === "undefined") return false;
  return (permissions & permissionsMap[perm]) == permissionsMap[perm];
}

module.exports = {
  hasPermission,
  permissionsMap
};
