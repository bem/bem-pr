'use strict';

var PATH = require('path'),
    BEM = require('bem'),
    Q = BEM.require('q'),
    U = BEM.util,
    MD = require('marked').setOptions({ gfm : true, pedantic : false, sanitize : false }),
    SHMAKOWIKI = require('shmakowiki'),
    createLevel = BEM.createLevel;


module.exports = function(registry) {

    registry.decl('DocLevelNode', 'MagicNode', {

        __constructor : function(o) {
            this.__base(o);

            this.path = o.level;
            this.item = o.item || o;

            delete this.item.elem;
            delete this.item.mod;
            delete this.item.val;

            this.level = createLevel(o.level);
            this.rootLevel = createLevel(this.root);
            this.levels = o.levels;
            this.sources = [];
            this.sourceItems = [];
        },

        make: function() {

            return this.ctx.arch.withLock(this.alterArch(), this);

        },

        getSourceBundleName: function() {
            return 'catalogue';
        },

        alterArch: function() {

            return function() {

                var _this = this,
                    arch = this.ctx.arch,
                    groupId = this.getId().slice(0, -1),
                    group;

                if (arch.hasNode(groupId)) {
                    group = arch.getNode(groupId);
                } else {
                    group = registry.getNodeClass('Node').create(groupId);

                    var magicNodeCl = registry.getNodeClass('MagicNode');

                    arch.setNode(group, arch.getParents(this).filter(function(p) {

                        return !(arch.getNode(p) instanceof magicNodeCl);
                    }), this);
                }

                var docNode = registry.getNodeClass(this.getDocNodeClass())
                        .create({
                            root: this.root,
                            level: this.path,
                            path: this.__self.createNodePrefix({
                                root: this.root,
                                level: this.level,
                                item: this.item}),
                            sourceBundle: this.getSourceBundleName(),
                            item: U.extend({}, _this.item)
                        }),

                    docSourceNode = registry.getNodeClass(this.getDocSourceNodeClass())
                        .create({
                            root: this.root,
                            level: this.path,
                            item: U.extend({}, _this.item),
                            path: this.__self.createNodePrefix({
                                root: this.root,
                                level: this.level,
                                item: this.item}),
                            levels: this.levels,
                            sources: this.sourceItems
                        });

                arch.setNode(docSourceNode);
                arch.setNode(docNode, groupId, docSourceNode.getId());

                var cat = this.__self.createId({
                        root: this.root,
                        level: this.level,
                        item: {
                            block: 'catalogue'
                        }
                    }).slice(0, -1),

                    index = this.__self.createId({
                        root: this.root,
                        level: this.level,
                        item: {
                            block: 'index'
                        }
                    }).slice(0, -1);

                if (groupId !== cat && groupId !== index) {
                    arch.addChildren(docNode.getId(), cat);
                }
            }
        },

        getDocNodeClass: function() {
            return 'DocNode';
        },

        getDocSourceNodeClass: function() {
            return 'DocSourceNode';
        },

        getTechs : function() {
            return this.__base.apply(this, arguments);
        },

        getSourceNodePrefix : function() {
            if(!this._sourceNodePrefix) {
                this._sourceNodePrefix = this.__self.createNodePrefix({
                    root  : this.root,
                    level : this.source.level,
                    item  : this.item
                });
            }

            return this._sourceNodePrefix;
        },

        getLevels : function(tech) {
            return this.__base.apply(this, arguments)
                .concat(
                    this.rootLevel
                        .getTech('blocks')
                        .getPath(this.getSourceNodePrefix())
                );
        },

        createTechNode : function(tech, bundleNode, magicNode) {
            if(tech === this.item.tech) {
                return this.setSourceItemNode(tech, bundleNode, magicNode);
            }
            return this.__base.apply(this, arguments);
        }

    }, {

        createId: function(o) {

            return PATH.dirname(this.createPath({
                root: o.root,
                level: o.level,
                item: {
                    block: o.item.block
                }
            })) + '.doc' + '*';
        },

        createPath : function(o) {
            return this.createNodePrefix(o);
        },

        createNodePrefix : function(o) {
            var level = typeof o.level === 'string'?
                    createLevel(PATH.resolve(o.root, o.level)) :
                    o.level;

            return PATH.relative(o.root, level.getByObj(o.item));
        }

    });

    registry.decl('DocNode', 'GeneratedFileNode', {

        __constructor : function(o) {
            this.source = o.path + '.data.json';
            o.path += '.html';

            this.__base(o);
            this.item = o.item;
            this.level = typeof o.level === 'string'? createLevel(o.level): o.level;
            this.sourceBundle = o.sourceBundle;
            this.rootLevel = createLevel(this.root);
        },

        make: function() {
            return this.buildHtml(U.readFile(this.source));
        },

        buildHtml: function(json) {
            var _this = this;

            return json.then(function(json) {
                json = JSON.parse(json);
                return _this.getResource(_this.item)
                    .spread(function(BEMJSON, BEMHTML) {

                        json = BEMJSON.build({
                            block: 'global',
                            pageTitle: _this.item.block,
                            data: json,
                            environ: {
                                'id': 'site',
                                'name': _this.sourceBundle
                            }
                        });

                        return U.writeFile(PATH.join(_this.root, PATH.dirname(_this.path), _this.item.block) + '.html', BEMHTML.apply(json));

                    });
            });
        },

        getResource : function(item) {

            var prefix = this.level.getByObj({
                    block: this.sourceBundle
                });

            var bemjson = this.getBemjson(prefix),
                bemhtml = this.getBemhtml(prefix);

            return Q.all([bemjson, bemhtml]);

        },

        getBemjson : function(prefix) {

            var path = PATH.join(PATH.dirname(prefix), '_' + this.sourceBundle + '.bem.json.js');
            return U.readFile(path)
                .then(function(data) {
                    return ( new Function('global', 'BEM', '"use strict";' + data + ';return BEM.JSON;') )();
                });

        },

        getBemhtml : function(prefix) {

            var path = PATH.join(PATH.dirname(prefix), '_' + this.sourceBundle + '.bemhtml.js');
            return Q.resolve(require(path).BEMHTML);

        }

    });

    registry.decl('DocSourceNode', 'GeneratedFileNode', {

        __constructor : function(o) {
            this.__base(o);
            this.item = o.item;
            this.level = typeof o.level === 'string'? createLevel(o.level): o.level;
            this.path += '.data.json';
            this.rootLevel = createLevel(this.root);
            this.sources = o.sources;
            this.levels = o.levels;
        },

        make: function() {

            var getObj = function() {
                    return {
                        toJSON: function() {
                            var _this = this;
                            return Object.keys(this).sort()
                                .filter(function(key) {
                                    return typeof _this[key] !== 'function';
                                })
                                .map(function(key) {
                                    return _this[key];
                                });
                        }
                    }
                },
                _this = this,
                json = {},
                content = this.scanExamples()
                    .then(function() {
                        return _this.sources.map(function(item) {
                            var content,
                                itemLevel = createLevel(item.level);

                            if (item.tech !== 'examples') {
                                var path = itemLevel.getPathByObj(item, item.suffix.substring(1));

                                content = U.readFile(path)
                                    .then(function(c) {
                                        if (item.tech === 'desc.md') return MD(c);
                                        if (item.tech === 'desc.wiki') return SHMAKOWIKI.shmakowikiToBemjson(c);

                                        return c;
                                    });
                            } else {


                                var exampleLevel = createLevel(itemLevel.getPathByObj(item, item.tech)),
                                    decl = exampleLevel.getItemsByIntrospection();

                                content = Q.all(decl.filter(function(item) {
                                        return item.tech === 'title.txt'
                                    })
                                    .map(function(exampleitem) {

                                        var examplePath = exampleLevel.getPathByObj(exampleitem, exampleitem.suffix.substring(1));

                                        return U.readFile(examplePath)
                                            .then(function(exampleDesc) {
                                                var url = PATH.join(
                                                    _this.rootLevel.getRelPathByObj({ block: item.block, tech: 'examples-set'}, 'examples-set'),
                                                    _this.level.getRelByObj(exampleitem));

                                                return {
                                                    url: url,
                                                    title: exampleDesc
                                                };
                                            });
                                    }));
                            }

                            json.name = item.block;
                            var obj = json;
                            if (item.elem) {
                                obj = obj.elems || (obj.elems = getObj());
                                obj = obj[item.elem] || (obj[item.elem] = {name: item.elem});
                            }

                            if (item.mod) {
                                obj = obj.mods || (obj.mods = getObj());
                                obj = obj[item.mod] || (obj[item.mod] = {name: item.mod});
                            }

                            if (item.val) {
                                obj = obj.vals || (obj.vals = getObj());
                                obj = obj[item.val] || (obj[item.val] = {name: item.val});
                            }

                            return content.then(function(content) {
                                var key = item.tech;
                                switch (item.tech) {
                                    case 'title.txt':
                                        key = 'title';
                                        break;
                                    case 'examples':
                                        break;
                                    default:
                                        key = 'description';
                                }

                                obj[key] = obj[key] || [];
                                obj[key].push({
                                    level: item.level,
                                    content: content
                                })
                            })

                        })
                    });

            return Q.all(content)
                .then(function() {
                    return U.mkdirp(PATH.dirname(_this.path))
                })
                .then(function() {
                    return U.writeFile(_this.path, JSON.stringify(json, null, 2));
                });
        },

        scanExamples: function() {

            return Q.all(this.levels.map(function(l) {
                var level = createLevel(l);

                level.getItemsByIntrospection()
                    .filter(function(item) {
                        return item.tech === 'examples' && item.block === this.item.block;
                    }, this)
                    .forEach(function(item) {
                        item.level = PATH.relative(this.root, level.dir);
                        this.sources.push(item);
                    }, this);

            }, this))
        }
    });

    registry.decl('DocCatalogueNode', 'DocLevelNode', {

        __constructor : function(o) {
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

        __constructor : function(o) {
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

        __constructor : function(o) {
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

    registry.decl('DocIndexNode', 'DocLevelNode', {

        __constructor : function(o) {
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

        alterArch : function() {
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
