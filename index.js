'use strict';

var PATH = require('path');

exports.extendMake = function(registry) {
    require('./nodes')(registry);
};

exports.getTestLevelPath = function() {
    return exports.resolve('test.blocks');
};

exports.require = require;
exports.resolve = PATH.resolve.bind(PATH, __dirname);
