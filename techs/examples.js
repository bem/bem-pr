'use strict';

var U = require('bem').util;

exports.API_VER = 2;

exports.baseTechPath = U.getBemTechPath('level-proto', {version: 2});

exports.techMixin = {
    getLevelProtoName: function() {
        return this.getTechName() + '-set';
    }
}
