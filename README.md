# PatreonHandler

Handles patreon webhook data and updates the database accordingly.

**See src/helpers/config.js for example config**

---

# endpoints

All endpoints require api key in the headers:
```
Authorization: Bearer <apikey>
```

---

### POST **/user/:userid/update**
Update guild supporters for specific user.
Call on these events:
 - Supporter leaves server.
 - Supporter gets demoted. (removed neccesary guild permissions)
 - User with flags gets promoted. (added neccesary guild permissions)
 - User with tier gets promoted. (added neccesary guild permissions)

### DELETE **/user/:userid/guilds/:guildid**
Opts user out of being a supporter for a guild.
Has no effect if user is not a supporter.

### POST **/user/:userid/guilds/:guildid**
Opts user back into being a supporter for a guild.
Has no effect if user is already a supporter.

### PATCH **/user/:userid/flags**
Updates flags for user

**body fields: (json)**
```
add: [Flag] (optional) adds flags.
remove: [Flag] (optional) removes flags.
clear: Boolean (optional) if it has to remove all existing flags. if true, the remove field is ignored and the add field will still apply after clearing.
```

**Example body:**
```JSON
{
    "add": ["EXAMPLE_FLAG", "EXAMPLE_FLAG"],
    "remove": ["EXAMPLE_FLAG"],
}
```

### PATCH **/guild/:guildid/flags**
Updates flags for guild.

**body fields: (json)**
```
add: [Flag] (optional) adds flags.
remove: [Flag] (optional) removes flags.
clear: Boolean (optional) if it has to remove all existing flags. if true, the remove field is ignored and the add field will still apply after clearing.
```

**Example body:**
```JSON
{
    "add": ["EXAMPLE_FLAG", "EXAMPLE_FLAG"],
    "remove": ["EXAMPLE_FLAG"]
}
```

### POST **/admin/refresh**
Triggers full database refresh.
Used whenever something went horribly wrong.

**query params:**
```
patreon: Boolean (optional) If it also has to retrieve new data from patreon on top of refreshing database.
```
