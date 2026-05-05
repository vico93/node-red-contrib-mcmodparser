module.exports = function(RED) {
    "use strict";

    const API_BASE = "https://api.curseforge.com";
    const MINECRAFT_GAME_ID = 432;
    const MODS_CLASS_ID = 6;

    const MOD_LOADER_TYPES = {
        "Any": 0,
        "Forge": 1,
        "Cauldron": 2,
        "LiteLoader": 3,
        "Fabric": 4,
        "Quilt": 5,
        "NeoForge": 6
    };

    const RELEASE_TYPES = {
        "": null,
        "Release": 1,
        "Beta": 2,
        "Alpha": 3
    };

    function CurseForgeNode(n) {
        RED.nodes.createNode(this, n);
        this.slug = n.slug;
        this.apiKey = this.credentials.apiKey;
        if (n.interval > 35790) {
            this.warn(RED._("curseforge.errors.invalidinterval"));
        }
        this.interval = (parseInt(n.interval) || 15) * 60000;
        this.interval_id = null;
        this.ignorefirst = n.ignorefirst || false;
        this.sendarray = n.sendarray || false;
        this.gameVersion = n.gameVersion || "";
        this.modLoaderType = n.modLoaderType || "";
        this.releaseType = n.releaseType || "";
        this.donefirst = false;

        var node = this;

        function getContextKey(key) {
            return `curseforge_${node.id}_${key}`;
        }

        function getCachedModId() {
            return node.context().get(getContextKey("modId"));
        }

        function setCachedModId(modId) {
            node.context().set(getContextKey("modId"), modId);
        }

        function getSeen() {
            return node.context().get(getContextKey("seen")) || {};
        }

        function setSeen(seen) {
            node.context().set(getContextKey("seen"), seen);
        }

        function getHeaders() {
            return {
                "Accept": "application/json",
                "x-api-key": node.apiKey
            };
        }

        async function resolveModId() {
            const cachedModId = getCachedModId();
            if (cachedModId) {
                return cachedModId;
            }

            const url = `${API_BASE}/v1/mods/search?gameId=${MINECRAFT_GAME_ID}&slug=${encodeURIComponent(node.slug)}&classId=${MODS_CLASS_ID}`;
            
            let response;
            try {
                response = await fetch(url, { headers: getHeaders() });
            } catch (error) {
                node.error("Failed to search mod: " + node.slug, error);
                node.status({ fill: "red", shape: "dot", text: RED._("curseforge.errors.failedfetch") });
                return null;
            }

            if (response.status === 401 || response.status === 403) {
                node.error("Invalid API Key", { status: response.status });
                node.status({ fill: "red", shape: "dot", text: RED._("curseforge.errors.invalidapikey") });
                return null;
            }

            if (response.status !== 200) {
                node.error("Bad Response during search: " + node.slug, { status: response.status });
                node.status({ fill: "red", shape: "dot", text: response.status + ": " + RED._("curseforge.errors.badstatuscode") });
                return null;
            }

            let data;
            try {
                data = await response.json();
            } catch (error) {
                node.error("Invalid JSON: " + node.slug, error);
                node.status({ fill: "red", shape: "dot", text: "Invalid JSON" });
                return null;
            }

            if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
                node.error("Mod not found: " + node.slug);
                node.status({ fill: "red", shape: "dot", text: RED._("curseforge.errors.modnotfound") });
                return null;
            }

            const modId = data.data[0].id;
            setCachedModId(modId);
            return modId;
        }

        function buildFilesUrl(modId) {
            let url = `${API_BASE}/v1/mods/${modId}/files`;
            const params = new URLSearchParams();
            
            if (node.gameVersion) {
                params.append("gameVersion", node.gameVersion.trim());
            }
            if (node.modLoaderType && MOD_LOADER_TYPES[node.modLoaderType] !== undefined) {
                params.append("modLoaderType", MOD_LOADER_TYPES[node.modLoaderType]);
            }
            
            const queryString = params.toString();
            if (queryString) {
                url += "?" + queryString;
            }
            
            return url;
        }

        async function getFiles() {
            if (!node.slug || typeof node.slug !== "string" || node.slug.trim() === "") {
                node.status({ fill: "red", shape: "dot", text: RED._("curseforge.errors.invalidslug") });
                node.error(RED._("curseforge.errors.invalidslug") + ": " + node.slug);
                return;
            }

            if (!node.apiKey) {
                node.status({ fill: "red", shape: "dot", text: RED._("curseforge.errors.noapikey") });
                node.error(RED._("curseforge.errors.noapikey"));
                return;
            }

            const modId = await resolveModId();
            if (!modId) {
                return;
            }

            const url = buildFilesUrl(modId);
            
            let response;
            try {
                response = await fetch(url, { headers: getHeaders() });
            } catch (error) {
                node.error("Failed Fetch: " + node.slug, error);
                node.status({ fill: "red", shape: "dot", text: RED._("curseforge.errors.failedfetch") });
                return;
            }

            if (response.status === 401 || response.status === 403) {
                node.error("Invalid API Key", { status: response.status });
                node.status({ fill: "red", shape: "dot", text: RED._("curseforge.errors.invalidapikey") });
                return;
            }

            if (response.status === 404) {
                node.error("Mod Not Found: " + node.slug);
                node.status({ fill: "red", shape: "dot", text: RED._("curseforge.errors.modnotfound") });
                return;
            }

            if (response.status !== 200) {
                node.error("Bad Response: " + node.slug, { status: response.status });
                node.status({ fill: "red", shape: "dot", text: response.status + ": " + RED._("curseforge.errors.badstatuscode") });
                return;
            }

            let data;
            try {
                data = await response.json();
            } catch (error) {
                node.error("Invalid JSON: " + node.slug, error);
                node.status({ fill: "red", shape: "dot", text: "Invalid JSON" });
                return;
            }

            if (!data.data || !Array.isArray(data.data)) {
                node.error("Unexpected response format: " + node.slug);
                node.status({ fill: "red", shape: "dot", text: "Unexpected response" });
                return;
            }

            let files = data.data;
            
            // Filter by release type if specified
            const releaseTypeFilter = RELEASE_TYPES[node.releaseType];
            if (releaseTypeFilter !== null) {
                files = files.filter(file => file.releaseType === releaseTypeFilter);
            }

            const seen = getSeen();
            const newFiles = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileId = file.id;
                const fileDate = file.fileDate ? new Date(file.fileDate).getTime() : 0;

                if (!fileId) continue;

                if (!(fileId in seen) || (seen[fileId] !== 0 && seen[fileId] !== fileDate)) {
                    seen[fileId] = fileDate;
                    newFiles.push(file);
                }
            }

            setSeen(seen);

            if (node.sendarray === true) {
                if (newFiles.length > 0) {
                    const msg = {
                        payload: newFiles,
                        files: newFiles,
                        project: node.slug,
                        topic: `${newFiles.length} new file(s) for ${node.slug}`
                    };
                    if (node.ignorefirst === true && node.donefirst === false) {
                        // do nothing
                    } else {
                        node.send(msg);
                    }
                }
            } else {
                for (let i = newFiles.length - 1; i >= 0; i--) {
                    const file = newFiles[i];
                    const msg = {
                        payload: file.displayName || file.fileName || "Unknown",
                        topic: file.displayName || file.fileName || "Unknown",
                        link: file.downloadUrl || "",
                        file: file,
                        project: node.slug
                    };

                    if (node.ignorefirst === true && node.donefirst === false) {
                        // do nothing
                    } else {
                        node.send(msg);
                    }
                }
            }

            node.status({ fill: "green", shape: "dot", text: "" });
        }

        node.interval_id = setInterval(function() {
            node.donefirst = true;
            getFiles();
        }, node.interval);

        setTimeout(getFiles, 2000);

        node.on("close", function() {
            if (node.interval_id != null) {
                clearInterval(node.interval_id);
            }
        });
    }

    RED.nodes.registerType("curseforge", CurseForgeNode, {
        credentials: {
            apiKey: { type: "password" }
        }
    });
};
