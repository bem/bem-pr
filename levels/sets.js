'use strict';

exports.baseLevelPath = require.resolve('bem/lib/levels/simple');

exports.getTechs = function() {
    return {
        'examples' : 'level-proto',
        'tests'    : 'level-proto'
    };
};
