module.exports = function(RED) {
    "use strict";

    const API_BASE = "https://api.modrinth.com/v2";
    const USER_AGENT = "node-red-contrib-mcmodparser/1.0.0";

    function ModrinthNode(n) {
        RED.nodes.createNode(this, n);
        this.slug = n.slug;
        if (n.interval > 35790) {
            this.warn(RED._("modrinth.errors.invalidinterval"));
        }
        this.interval = (parseInt(n.interval) || 15) * 60000;
        this.interval_id = null;
        this.ignorefirst = n.ignorefirst || false;
        this.sendarray = n.sendarray || false;
        this.loaders = n.loaders || "";
        this.gameVersions = n.gameVersions || "";
        this.releaseType = n.releaseType || "";
        this.donefirst = false;

        var node = this;

        function buildUrl() {
            let url = `${API_BASE}/project/${encodeURIComponent(node.slug)}/version`;
            const params = new URLSearchParams();
            
            if (node.loaders) {
                const loaders = node.loaders.split(",").map(s => s.trim()).filter(Boolean);
                if (loaders.length > 0) {
                    params.append("loaders", JSON.stringify(loaders));
                }
            }
            if (node.gameVersions) {
                const versions = node.gameVersions.split(",").map(s => s.trim()).filter(Boolean);
                if (versions.length > 0) {
                    params.append("game_versions", JSON.stringify(versions));
                }
            }
            
            const queryString = params.toString();
            if (queryString) {
                url += "?" + queryString;
            }
            
            return url;
        }

        function getContextKey() {
            return `modrinth_${node.id}_seen`;
        }

        function getSeen() {
            return node.context().get(getContextKey()) || {};
        }

        function setSeen(seen) {
            node.context().set(getContextKey(), seen);
        }

        async function getVersions() {
            if (!node.slug || typeof node.slug !== "string" || node.slug.trim() === "") {
                node.status({ fill: "red", shape: "dot", text: RED._("modrinth.errors.invalidslug") });
                node.error(RED._("modrinth.errors.invalidslug") + ": " + node.slug);
                return;
            }

            let response;
            try {
                response = await fetch(buildUrl(), {
                    headers: {
                        "User-Agent": USER_AGENT
                    }
                });
            } catch (error) {
                node.error("Failed Fetch: " + node.slug, error);
                node.status({ fill: "red", shape: "dot", text: RED._("modrinth.errors.failedfetch") });
                return;
            }

            if (response.status === 404) {
                node.error("Project Not Found: " + node.slug);
                node.status({ fill: "red", shape: "dot", text: RED._("modrinth.errors.projectnotfound") });
                return;
            }

            if (response.status !== 200) {
                node.error("Bad Response: " + node.slug, { status: response.status });
                node.status({ fill: "red", shape: "dot", text: response.status + ": " + RED._("modrinth.errors.badstatuscode") });
                return;
            }

            let versions;
            try {
                versions = await response.json();
            } catch (error) {
                node.error("Invalid JSON: " + node.slug, error);
                node.status({ fill: "red", shape: "dot", text: "Invalid JSON" });
                return;
            }

            if (!Array.isArray(versions)) {
                node.error("Unexpected response format: " + node.slug);
                node.status({ fill: "red", shape: "dot", text: "Unexpected response" });
                return;
            }

            // Filter by release type if specified
            if (node.releaseType) {
                versions = versions.filter(v => v.version_type === node.releaseType);
            }

            const seen = getSeen();
            const newVersions = [];

            for (let i = 0; i < versions.length; i++) {
                const version = versions[i];
                const versionId = version.id;
                const publishedTime = version.date_published ? new Date(version.date_published).getTime() : 0;

                if (!versionId) continue;

                if (!(versionId in seen) || (seen[versionId] !== 0 && seen[versionId] !== publishedTime)) {
                    seen[versionId] = publishedTime;
                    newVersions.push(version);
                }
            }

            setSeen(seen);

            if (node.sendarray === true) {
                if (newVersions.length > 0) {
                    const msg = {
                        payload: newVersions,
                        versions: newVersions,
                        project: node.slug,
                        topic: `${newVersions.length} new version(s) for ${node.slug}`
                    };
                    if (node.ignorefirst === true && node.donefirst === false) {
                        // do nothing
                    } else {
                        node.send(msg);
                    }
                }
            } else {
                for (let i = newVersions.length - 1; i >= 0; i--) {
                    const version = newVersions[i];
                    const msg = {
                        payload: version.changelog || "",
                        topic: version.name || version.version_number || "Unknown",
                        link: `https://modrinth.com/project/${node.slug}/version/${version.version_number || version.id}`,
                        version: version,
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
            getVersions();
        }, node.interval);

        setTimeout(getVersions, 2000);

        node.on("close", function() {
            if (node.interval_id != null) {
                clearInterval(node.interval_id);
            }
        });
    }

    RED.nodes.registerType("modrinth", ModrinthNode);
};
