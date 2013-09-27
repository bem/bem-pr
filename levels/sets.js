'use strict';

exports.baseLevelPath = require.resolve('bem/lib/levels/simple');

exports.getTechs = function() {
    return {
        'examples' : 'v2/level-proto',
        'tests'    : 'v2/level-proto'
    };
};
