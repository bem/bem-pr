'use strict';
var PATH = require('path'),
    BEM_SETS_TECHS = PATH.resolve(__dirname, '../../../techs'),
    join = PATH.join;

exports.getTechs = function() {
    var techs = {
        'blocks' : '',
        'bundles' : '',
        'bemjson.js' : '',

        'bemdecl.js' : 'bemdecl.js',
        'deps.js' : 'deps.js',
        'js' : 'js-i',
        'css' : 'css',
        'ie.css' : 'ie.css',
        'ie6.css' : 'ie6.css',
        'ie7.css' : 'ie7.css',
        'ie8.css' : 'ie8.css',
        'ie9.css' : 'ie9.css',
        'tests': 'level-proto',
        'examples': 'level-proto'
    };

    ['test-tmpl', 'phantomjs', 'test.js'].forEach(function(name) {
        techs[name] = join(BEM_SETS_TECHS, name + '.js');
    });

    return techs;
};
