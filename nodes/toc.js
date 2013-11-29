'use strict';

var PATH = require('path'),
    BEM = require('bem'),
    Q = BEM.require('q'),
    U = BEM.util,
    createLevel = BEM.createLevel;

/**
 * Declare nodes responsible of building the documentation index (toc).
 */
module.exports = function(registry) {

    /**
     * The high level node for documentation index. On execution creates IndexBundleNode and IndexSourceNode nodes.
     * @class DocLevelNode
     */
    registry.decl('DocIndexNode', 'DocLevelNode', {

        __constructor: function(o) {
            this.__base(o);
        },

        getSourceBundleName: function() {
            return 'index';
        },

        getDocNodeClass: function() {
            return 'IndexBundleNode';
        },

        getDocSourceNodeClass: function() {
            return 'IndexSourceNode';
        }

    });

    /**
     * The node does only create a source file to build the index. Will create a data.json file describing
     * the documented blocks on execution.
     * @class JsDocSourceNode
     */
    registry.decl('IndexSourceNode', 'CatalogueSourceNode', {

        __constructor: function(o) {
            this.__base(o);

            this.item = o.item;
            this.levels = o.levels;
        },

        /**
         * Return the string content to write into the source file.
         * @returns {string} Content.
         */
        getSourceContent: function() {

            return 'exports.blocks = ' + JSON.stringify([
                { 'block': 'global' },
                { 'block': 'page', mods: { type: 'index' } },
                { 'block': 'catalogue', mods: { type: 'showcase' } },
                { 'block': 'catalogue', elems: ['item'] },
                { 'block': 'block' }
            ]) + ';'
        },

        make: function() {
            var _this = this;

            // get tech names which represent the documentation in some form (md, title.txt, etc)
            var docTechs = registry.getNodeClass('SetsLevelNode')
                .getSourceItemsMap()['docs'];

            return this.__base()
                .then(function() {

                    var blocks = {};

                    // collect the blocks which have documentation files on the levels
                    _this.levels.forEach(function(level) {
                        level = createLevel(level);

                        level.getItemsByIntrospection()
                            .filter(function(item) {
                                return ~docTechs.indexOf(item.tech);
                            })
                            .map(function(item) {
                                blocks[item.block] = true;
                            });

                    });

                    // build a json file. Every collected block will be there as an object with name, title and url properties
                    var data = Object.keys(blocks)
                        .map(function(block) {

                            return {
                                name: block,
                                url: '../' + block + '/' + block + '.html',
                                title: block
                            };
                        });

                    return U.writeFile(
                        PATH.join(PATH.dirname(_this.path), _this.item.block + '.data.json'),
                        JSON.stringify(data));
                })
        }
    });

    /**
     * Builds the index bundle. Inherits from the BundleNode so behavior is the same with a little addition. Extra DocNode
     * instance is created which depends on bundle's bemhtml and bem.json files. This node will create html by applying
     * bemhtml, bem.json and data.json together.
     * @class CatalogueBundleNode
     */
    registry.decl('IndexBundleNode', 'CatalogueBundleNode', {

        alterArch: function() {
            var base = this.__base();
            return function() {

                var _this = this,
                    arch = _this.ctx.arch;

                return Q.when(base.call(_this), function(bundle) {
                    var docNode = registry.getNodeClass('DocNode')
                        .create({
                            root: _this.root,
                            level: PATH.dirname(_this.path),
                            path: _this.__self.createNodePrefix({
                                root: _this.root,
                                level: _this.level,
                                item: _this.item}),
                            sourceBundle: 'index',
                            item: U.extend({}, _this.item)
                        });

                    arch.setNode(docNode, _this.path, [
                        _this.getBundlePath('bemhtml.js'),
                        _this.getBundlePath('bem.json.js')]
                        .map(function(path) {
                            return PATH.join(PATH.dirname(path), '_' + PATH.basename(path));
                        }));
                })
            }
        }
    });
}
