'use strict';

function extendMake(registry) {
    require('../../../').extendMake(registry);

    registry.decl('Arch', {

        blocksLevelsRegexp: /^.+?\.blocks/,

        bundlesLevelsRegexp: /^.+?\.bundles$/,

        createCustomNodes: function(common, libs, blocks) {
            return registry.getNodeClass('SetsNode')
                .create({
                    root: this.root,
                    arch: this.arch
                })
                .alterArch();
        }
    });

    registry.decl('BundleNode', {
        getTechs: function() {
            return [
                'bemjson.js',
                'bemdecl.js',
                'deps.js',
                'css',
                'js'
            ];
        }
    });

    registry.decl('SetsNode', {
        getSets: function() {
            return {
                'desktop': ['common.blocks', 'desktop.blocks'],
                'touch': ['common.blocks', 'touch.blocks']
            };
        }
    });

    registry.decl('ExampleNode', {
        getTechs: function() {
            return [
                'bemjson.js',
                'bemdecl.js',
                'deps.js',
                'css',
                'js'
            ];
        }
    });

    registry.decl('TestNode', {
        getTechs: function() {
            return [
                'bemjson.js',
                'bemdecl.js',
                'deps.js',
                'test.js'
            ];
        }
    });

    registry.decl('SetsLevelNode', {
        getSourceItemTechs: function() {
            return ['examples', 'test.js'];
        }
    });

}

if (typeof MAKE === 'undefined') {
    module.exports = extendMake;
} else {
    /*global MAKE*/
    extendMake(MAKE);
}

