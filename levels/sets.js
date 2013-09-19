'use strict';

exports.baseLevelPath = require.resolve('bem/lib/levels/simple');

exports.getTechs = function() {
    return {
        'examples-set': 'level-proto',
        'tests-set'   : 'level-proto'
    };
};
