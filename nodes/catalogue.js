'use strict';

var PATH = require('path'),
    BEM = require('bem'),
    Q = BEM.require('q'),
    U = BEM.util,
    createLevel = BEM.createLevel;

module.exports = function(registry) {
    registry.decl('DocCatalogueNode', 'DocLevelNode', {

        __constructor: function(o) {
            this.__base(o);
        },

        getDocNodeClass: function() {
            return 'CatalogueBundleNode';
        },

        getDocSourceNodeClass: function() {
            return 'CatalogueSourceNode';
        }

    });

    registry.decl('CatalogueSourceNode', 'GeneratedFileNode', {

        __constructor: function(o) {
            this.__base(o);
            this.path += '.bemdecl.js';
            this.rootLevel = createLevel(this.root);
        },

        make: function() {

            var _this = this;

            return Q.all([U.mkdirp(PATH.dirname(this.path)), this.getSourceContent()])
                .spread(function(mkdir, content) {
                    return U.writeFile(_this.path, content);
                })
        },

        getSourceContent: function() {
            return 'exports.blocks = ' + JSON.stringify([
                { 'block': 'global' },
                { 'block': 'page' },
                { 'block': 'catalogue' },
                { 'block': 'block' },
                { 'block': 'example' },
                { 'block': 'b-text' },
                { 'block': 'b-link' }
            ]) + ';'
        }

    });

    registry.decl('CatalogueBundleNode', 'BundleNode', {

        __constructor: function(o) {
            this.__base(o);
            this.path = PATH.dirname(this.path);
            this.rootLevel = createLevel(this.root);
        },

        getTechs: function() {
            return [
                'bemdecl.js',
                'deps.js',
                'css',
                'js',
                'bem.json.js',
                'bemhtml'
            ]
        },

        'create-bem.json.js-optimizer-node': function(tech, sourceNode, bundleNode) {
            return this.createBorschikOptimizerNode('js', sourceNode, bundleNode);
        },

        getLevels: function() {
            return [
                PATH.resolve(this.root, 'libs/bem-bl/blocks-common'),
                PATH.resolve(this.root, 'libs/bem-bl/blocks-desktop'),
                PATH.resolve(__dirname, '../common.blocks'),
                PATH.resolve(__dirname, '../site.blocks')
            ];

        }
    });
}
