# PatreonHandler

Handles patreon webhook data and updates the database accordingly.

**See src/helpers/config.js for example config**

---

# endpoints

All endpoints require api key in the headers:
```
authorization: Bearer <apikey>
```

# responses

All endpoints respond with json.

**Note:** error messages can vary depending on what went wrong, depend on status code as primary source and error message as detail.
## success

Currently no endpoints use the data field

status: `200`
```JSON
{
    "status": 200,
    "success": true,
    "?data": "this field is context specific"
}
```


## data not found

status: `404`
```JSON
{
    "status": 404,
    "success": false,
    "error": "Not found"
}
```

## invalid request

status: `400`
```JSON
{
    "status": 400,
    "success": false,
    "error": "Invalid request"
}
```

## api key invalid or missing

status: `401`
```JSON
{
    "status": 401,
    "success": false,
    "error": "Not authorized"
}
```

## internal server error

status: `500`
```JSON
{
    "status": 500,
    "success": false,
    "error": "Internal server error"
}
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
