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
- **Ignore First** - Don't send messages on the first poll (useful to avoid flooding on deploy)

### Outputs

- **topic** - *string* - Name of the version
- **payload** - *string* - Changelog of the version
- **link** - *string* - URL link to the version on Modrinth
- **version** - *object* - Complete version object from the API
- **project** - *string* - The project slug being monitored

The `msg.version` property contains the complete version object from the Modrinth API, which includes properties such as `.version_number`, `.game_versions`, `.loaders`, `.files`, `.date_published`, and so on.

If you select to return a single array, the message will have the versions in `msg.payload` and `msg.versions`.
