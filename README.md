# node-red-contrib-mcmodparser

A [Node-RED](http://nodered.org) node to monitor mod updates from [Modrinth](https://modrinth.com).

## Install

Run the following command in your Node-RED user directory - typically `~/.node-red`

```
npm install node-red-contrib-mcmodparser
```

## Usage

Monitors a Modrinth project for new versions.

### Configuration

- **Project Slug** - The Modrinth project slug (e.g., `sodium`)
- **Refresh Interval** - Polling interval in minutes (default: 15, max: 35790)
- **Loaders** - Optional: Comma-separated list of mod loaders to filter (e.g., `fabric,quilt`)
- **Game Versions** - Optional: Comma-separated list of Minecraft versions to filter (e.g., `1.20.1,1.20.2`)
- **Send as Array** - Return all new versions as a single array instead of individual messages
- **Ignore First** - Don't send messages on the first poll (useful to avoid flooding on deploy or restart)

#### About "Ignore First"

When enabled, this option prevents the node from sending any messages during the first poll after the flow is deployed or Node-RED is restarted. This is useful to avoid receiving a flood of all existing versions when you first set up the node. After the first poll, only **new** versions (those not seen before) will be sent.

**Example:** If a project has 50 published versions and you deploy the flow with "Ignore First" checked, you won't receive all 50 versions at once. Instead, you'll only receive versions published after the deployment.

### Outputs

- **topic** - *string* - Name of the version
- **payload** - *string* - Changelog of the version
- **link** - *string* - URL link to the version on Modrinth
- **version** - *object* - Complete version object from the API
- **project** - *string* - The project slug being monitored

The `msg.version` property contains the complete version object from the Modrinth API, which includes properties such as `.version_number`, `.game_versions`, `.loaders`, `.files`, `.date_published`, and so on.

If you select to return a single array, the message will have the versions in `msg.payload` and `msg.versions`.
