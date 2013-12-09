'use strict';

var PATH = require('path');

//exports.baseLevelPath = require.resolve('bem/lib/levels/simple');

exports.getTechs = function() {
    return {
        'examples-set': 'level-proto',
        'tests-set'   : 'level-proto',
        'bemdecl.js'  : 'v2/bemdecl.js',
        'deps.js': 'v2/deps.js',
        'js': 'v2/js-i',
        'css': 'v2/css',
        'bem.json.js': PATH.resolve(__dirname, '../techs/bem.json.js'),
        'bemhtml': PATH.resolve(__dirname, '../libs/bem-bl/blocks-common/i-bem/bem/techs/v2/bemhtml.js'),
        'bemtree': PATH.resolve(__dirname, '../libs/bem-bl/blocks-common/i-bem/bem/techs/v2/bemtree.js')
    };
};
