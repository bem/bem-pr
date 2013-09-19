'use strict';

exports.baseLevelPath = require.resolve('bem/lib/levels/simple');

exports.getTechs = function() {
    return {
        'bemjson.js': 'bem/lib/tech/v2'
    };
};

