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
});
