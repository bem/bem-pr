/*global MAKE */
'use strict';

var bemSets = require('../../../');

bemSets.extendMake(MAKE);
require('../../.bem/nodes').extendMake(MAKE);

MAKE.decl('Arch', {

    createCustomNodes : function() {
        return MAKE.getNodeClass('SetsNode')
            .create({
                root : this.root,
                arch : this.arch
            })
            .alterArch();
    }

});

MAKE.decl('SetsNode', {

    getSets : function() {
        return {
            'desktop' : ['common.blocks', 'desktop.blocks'],
            'touch' : ['common.blocks', 'touch.blocks']
        };
    }

});

MAKE.decl('SetsLevelNode', {

    getSourceItemTechs : function() {
        return [ 'test.js', 'examples' ];
    }

});

// TODO: configure examples building process
//MAKE.decl('ExampleNode', {
//
//    getLevels : function() {
//        return [];
//    }
//
//});

// TODO: configure tests building process
//MAKE.decl('TestNode', {
//
//    getLevels : function() {
//        return [];
//    }
//
//});
