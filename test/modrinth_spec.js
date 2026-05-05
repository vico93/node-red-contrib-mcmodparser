var should = require("should");
var helper = require("node-red-node-test-helper");
var modrinthNode = require("../modrinth/modrinth.js");

helper.init(require.resolve('node-red'));

describe('modrinth Node', function () {
    this.timeout(10000);

    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    it('should be loaded', function (done) {
        var flow = [{ id: "n1", type: "modrinth", name: "test name", slug: "sodium" }];
        helper.load(modrinthNode, flow, function () {
            var n1 = helper.getNode("n1");
            try {
                n1.should.have.property('name', 'test name');
                n1.should.have.property('slug', 'sodium');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should have default interval', function (done) {
        var flow = [{ id: "n1", type: "modrinth", name: "test", slug: "sodium" }];
        helper.load(modrinthNode, flow, function () {
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
        var flow = [{ id: "n1", type: "modrinth", name: "test", slug: "sodium", interval: 30 }];
        helper.load(modrinthNode, flow, function () {
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
        var flow = [{ id: "n1", type: "modrinth", name: "test", slug: "sodium", ignorefirst: true }];
        helper.load(modrinthNode, flow, function () {
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
            { id: "n1", type: "modrinth", name: "test", slug: "sodium", ignorefirst: true, wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];
        helper.load(modrinthNode, flow, function () {
            var n2 = helper.getNode("n2");
            var n1 = helper.getNode("n1");
            
            // If ignorefirst is working, n2 should NOT receive any messages 
            // during the initial 2-second timeout period
            var messageReceived = false;
            n2.on("input", function (msg) {
                messageReceived = true;
            });
            
            // Wait a bit longer than the initial 2-second timeout
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
});
