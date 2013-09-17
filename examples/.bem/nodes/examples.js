'use strict';

exports.extendMake = function (registry) {
    registry.decl('ExampleNode', {

        getTechs : function() {
            return [
                'bemjson.js',
                'bemdecl.js',
                'deps.js',
                'css',
                'js'
            ];
        }

    });
};
