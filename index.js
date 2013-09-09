'use strict';

var PATH = require('path');

exports.extendMake = function(registry) {
    require('./nodes')(registry);
};

/**
 * Resolve path to the `techName` tech module
 * @param techName
 * @returns {String}
 */
exports.resolveTech = function(techName) {
    return require.resolve('./techs/' + techName);
};

/**
 * Resolve path to the `levelName` level config module
 * @param levelName
 * @returns {String}
 */
exports.resolveLevel = function(levelName) {
    return require.resolve('./levels/' + levelName);
};

// not recommended to use, package structure could change at any time
exports.require = require;
exports.resolve = PATH.resolve.bind(PATH, __dirname);
