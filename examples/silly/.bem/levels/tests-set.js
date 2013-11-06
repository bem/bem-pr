'use strict';
var BEM = require('bem'),
    bemSets = require('../../../../');

exports.baseLevelPath = require.resolve('./examples-set.js');

exports.getTechs = function() {

    return BEM.util.extend({}, this.__base(), {
        'phantomjs'  : bemSets.resolveTech('phantomjs'),
        'test-tmpl'  : bemSets.resolveTech('test-tmpl'),
        'test.js'    : bemSets.resolveTech('test.js')
    });
};
