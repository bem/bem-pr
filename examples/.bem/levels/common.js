'use strict';
var PATH = require('path'),
    BEM_SETS_TECHS = PATH.resolve(__dirname, '../../../techs'),
    join = PATH.join;

exports.getTechs = function() {
    var techs = {
        'blocks' : 'bem/lib/tech/v2',
        'bundles' : 'bem/lib/tech/v2',
        'bemjson.js' : 'bem/lib/tech/v2',

        'bemdecl.js' : 'v2/bemdecl.js',
        'deps.js' : 'v2/deps.js',
        'js' : 'v2/js-i',
        'css' : 'v2/css',
        'ie.css' : 'v2/ie.css',
        'ie6.css' : 'v2/ie6.css',
        'ie7.css' : 'v2/ie7.css',
        'ie8.css' : 'v2/ie8.css',
        'ie9.css' : 'v2/ie9.css',
        'tests': 'level-proto',
        'examples': 'level-proto'
    };

    ['test-tmpl', 'phantomjs', 'test.js'].forEach(function(name) {
        techs[name] = join(BEM_SETS_TECHS, name + '.js');
    });

    return techs;
};
