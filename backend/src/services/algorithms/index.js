const slidingWindow = require("./slidingWindow");
const fixedWindow = require("./fixedWindow");
const tokenBucket = require("./tokenBucket");

const algorithms = {
    sliding: slidingWindow,
    fixed: fixedWindow,
    token_bucket: tokenBucket
};

/**
 * Resolves the algorithm implementation by name.
 * Defaults to sliding window if the name is unrecognized.
 * @param {string} name - The algorithm name.
 * @returns {Object} - The algorithm module containing the check function.
 */
function getAlgorithm(name) {
    return algorithms[name] || algorithms.sliding;
}

module.exports = {
    getAlgorithm,
    algorithms
};
