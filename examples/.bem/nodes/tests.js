'use strict';

exports.extendMake = function (registry) {
    registry.decl('TestNode', {

        getTechs : function() {
            return [
                'bemjson.js',
                'bemdecl.js',
                'deps.js',
                'test.js'
            ];
        }

    });
};
