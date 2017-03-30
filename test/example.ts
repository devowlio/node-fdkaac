const testCase = require("mocha").describe;
const pre = require("mocha").before;
const assertions = require("mocha").it;
const assert = require("chai").assert;

const fdkaac = require("../index");

testCase("Group", () => {
    assertions("Example", () => {
        assert.equal(1, 1);
    });
});