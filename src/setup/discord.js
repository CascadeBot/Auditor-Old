const { DiscordCore, DiscordHooks } = require("discord-user-js");
const { discord: discordConfig } = require("../helpers/config");
const { getDB } = require("./db");
const { Long } = require("mongodb");

function setupDiscord() {
  DiscordCore.setCredentials(discordConfig);
  DiscordCore.addHook(DiscordHooks.tokenUpdate,
    async ({accessToken, refreshToken, userId}) => {
      const updated = await getDB().users.findOneAndUpdate({
          _id: Long.fromString(userId)
        }, {
          $set: {
            accessToken,
            refreshToken
          }
        });
      if (!updated) {
        const e = new Error("Failed to update user tokens");
        console.error(e);
        throw e;
      }
    }
  );
}

module.exports = {
  setupDiscord,
};
