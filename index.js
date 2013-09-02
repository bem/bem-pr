'use strict';

var PATH = require('path');

exports.extendMake = function(registry) {
    require('./nodes')(registry);
};

exports.require = require;
exports.resolve = PATH.resolve.bind(PATH, __dirname);
