'use strict';

var PATH = require('path'),
    BEM = require('bem'),
    Q = BEM.require('q'),
    U = BEM.util,
    createLevel = BEM.createLevel;

/**
 * Declare nodes which serve catalogue bundle. Catalogue contains common files (css, js, bemhtml, bem.json) for
 * blocks documentation bundles.
 */
module.exports = function(registry) {

    /**
     * Inherited from the DocLevelNode this node is used as entry point to build catalogue. After execution it will
     * extend the nodes tree with CatalogueBundleNode and CatalogueSourceNode instances.
     * @class DocCatalogueNode
     */
    registry.decl('DocCatalogueNode', 'DocLevelNode', {

        __constructor: function(o) {
            this.__base(o);
        },

        /**
         * Return node class name which is used as a bundle node.
         * @returns {string} Bundle node class name.
         */
        getDocNodeClass: function() {
            return 'CatalogueBundleNode';
        },

        /**
         * Return node class name which is used as a source node. Source node is responsible of creating the source
         * (bemjson for example) files to build the bundle. The bundle node is dependant on Source node and when it's
         * execution begins the input data will be ready to use.
         * @returns {string} Catalog source node class name.
         */
        getDocSourceNodeClass: function() {
            return 'CatalogueSourceNode';
        }

    });

    /**
     * The node does only create a source file to build a bundle. Will create a bemdecl.js file on execution.
     * @class CatalogueSourceNode
     */
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

        /**
         * Return the string content to write into the source file.
         * @returns {string} Content.
         */
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


    /**
     * Builds catalogue bundle. Inherits from the BundleNode and does only override getTechs() and getLevels() methods
     * to configure the build.
     * @class CatalogueBundleNode
     */
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
