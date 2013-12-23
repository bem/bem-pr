'use strict';

var U = require('bem/lib/util'),
    PATH = require('path');

exports.API_VER = 2;

exports.baseTechPath = require.resolve('bem/lib/techs/v2/level-proto');

exports.techMixin = {

    getLevelProtoName: function() {
        return this.getTechName() + '-set';
    }
}
