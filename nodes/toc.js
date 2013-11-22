'use strict';

var PATH = require('path'),
    BEM = require('bem'),
    Q = BEM.require('q'),
    U = BEM.util,
    createLevel = BEM.createLevel;

module.exports = function(registry) {
    
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

    registry.decl('IndexSourceNode', 'CatalogueSourceNode', {

        __constructor: function(o) {
            this.__base(o);

            this.item = o.item;
            this.levels = o.levels;
        },

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

            var docTechs = registry.getNodeClass('SetsLevelNode')
                .getSourceItemsMap()['docs'];

            return this.__base()
                .then(function() {

                    var blocks = {};

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
