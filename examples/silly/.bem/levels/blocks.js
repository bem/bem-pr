'use strict';
var bemSets = require('../../../../');

exports.getTechs = function() {
    var techs;
    techs = {
        'examples': 'level-proto',
        'tests': 'level-proto',
        'test.js': bemSets.resolveTech('test.js')
    };
    return techs;
};
