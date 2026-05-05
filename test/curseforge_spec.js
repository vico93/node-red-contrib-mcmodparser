var should = require("should");
var helper = require("node-red-node-test-helper");
var curseForgeNode = require("../curseforge/curseforge.js");

helper.init(require.resolve('node-red'));

describe('curseforge Node', function () {
    this.timeout(10000);

    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    it('should be loaded', function (done) {
        var flow = [{ 
            id: "n1", 
            type: "curseforge", 
            name: "test name", 
            slug: "jei",
            apiKey: "test-api-key"
        }];
        helper.load(curseForgeNode, flow, function () {
            var n1 = helper.getNode("n1");
            try {
                n1.should.have.property('name', 'test name');
                n1.should.have.property('slug', 'jei');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should have default interval', function (done) {
        var flow = [{ 
            id: "n1", 
            type: "curseforge", 
            name: "test", 
            slug: "jei",
            apiKey: "test-api-key"
        }];
        helper.load(curseForgeNode, flow, function () {
            var n1 = helper.getNode("n1");
            try {
                n1.should.have.property('interval', 15 * 60000);
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should accept custom interval', function (done) {
        var flow = [{ 
            id: "n1", 
            type: "curseforge", 
            name: "test", 
            slug: "jei", 
            interval: 30,
            apiKey: "test-api-key"
        }];
        helper.load(curseForgeNode, flow, function () {
            var n1 = helper.getNode("n1");
            try {
                n1.should.have.property('interval', 30 * 60000);
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should have ignorefirst property', function (done) {
        var flow = [{ 
            id: "n1", 
            type: "curseforge", 
            name: "test", 
            slug: "jei", 
            ignorefirst: true,
            apiKey: "test-api-key"
        }];
        helper.load(curseForgeNode, flow, function () {
            var n1 = helper.getNode("n1");
            try {
                n1.should.have.property('ignorefirst', true);
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should suppress messages on first poll when ignorefirst is enabled', function (done) {
        var flow = [
            { 
                id: "n1", 
                type: "curseforge", 
                name: "test", 
                slug: "jei", 
                ignorefirst: true, 
                apiKey: "test-api-key",
                wires: [["n2"]] 
            },
            { id: "n2", type: "helper" }
        ];
        helper.load(curseForgeNode, flow, function () {
            var n2 = helper.getNode("n2");
            var n1 = helper.getNode("n1");
            
            var messageReceived = false;
            n2.on("input", function (msg) {
                messageReceived = true;
            });
            
            setTimeout(function() {
                try {
                    messageReceived.should.be.false();
                    n1.should.have.property('donefirst', false);
                    done();
                } catch (err) {
                    done(err);
                }
            }, 3000);
        });
    });

    it('should require api key', function (done) {
        var flow = [{ 
            id: "n1", 
            type: "curseforge", 
            name: "test", 
            slug: "jei"
        }];
        helper.load(curseForgeNode, flow, function () {
            var n1 = helper.getNode("n1");
            try {
                n1.should.have.property('apiKey', undefined);
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should have releaseType property', function (done) {
        var flow = [{ 
            id: "n1", 
            type: "curseforge", 
            name: "test", 
            slug: "jei",
            releaseType: "Release",
            apiKey: "test-api-key"
        }];
        helper.load(curseForgeNode, flow, function () {
            var n1 = helper.getNode("n1");
            try {
                n1.should.have.property('releaseType', 'Release');
                done();
            } catch (err) {
                done(err);
            }
        });
    });
});
