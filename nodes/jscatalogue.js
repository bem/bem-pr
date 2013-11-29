'use strict';

var PATH = require('path');

module.exports = function(registry) {
    registry.decl('JsDocCatalogueNode', 'JsDocLevelNode', {

        __constructor: function(o) {
            this.__base(o);
        },

        getDocNodeClass: function() {
            return 'JsCatalogueBundleNode';
        },

        getDocSourceNodeClass: function() {
            return 'JsCatalogueSourceNode';
        }

    });

    registry.decl('JsCatalogueSourceNode', 'CatalogueSourceNode', {

        __constructor: function(o) {
            this.__base(o);
        },

        getSourceContent: function() {
            return 'exports.blocks = ' + JSON.stringify([
                { 'block': 'page' }
            ]) + ';'
        }

    });

    registry.decl('JsCatalogueBundleNode', 'CatalogueBundleNode', {

        __constructor: function(o) {
            this.__base(o);
        },

        getTechs: function() {
            return [
                'bemdecl.js',
                'deps.js',
                'css',
                'js',
                'bemtree',
                'bemhtmlcore'
            ]
        },

        getLevels: function() {
            return [
                PATH.resolve(this.root, 'libs/bem-core/common.blocks'),
                PATH.resolve(this.root, 'libs/bem-core/desktop.blocks'),
                PATH.resolve(__dirname, '../jsdoccatalogue.blocks')
            ];

        },

        'create-bemhtmlcore-optimizer-node': function(tech, sourceNode, bundleNode) {
            return this['create-js-optimizer-node'].apply(this, arguments);
        }
    });
}
