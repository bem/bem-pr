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
                {'block': 'b-page'}
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
                'bemhtml'
            ]
        },

        getLevels: function() {
            return [
                '../libs/bem-bl/blocks-common',
                '../libs/bem-bl/blocks-desktop',
                '../common.blocks',
                '../jsdoccatalogue.blocks'
            ]
            .map(function(path) {
                return PATH.resolve(__dirname, path);
            });
        }
    });
}
