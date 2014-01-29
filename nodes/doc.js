'use strict';

var PATH = require('path'),
    BEM = require('bem'),
    Q = BEM.require('q'),
    U = BEM.util,
    MD = require('marked').setOptions({gfm : true, pedantic : false, sanitize : false}),
    SHMAKOWIKI = require('shmakowiki'),
    createLevel = BEM.createLevel;

/**
 * Declare node classes which serve the build of documentation for the blocks.
 */
module.exports = function(registry) {

    /**
     * The high level node for documentation. Created one per block. On execution creates so called source and doc
     * nodes.
     * @class DocLevelNode
     */
    registry.decl('DocLevelNode', 'MagicNode', {

        __constructor : function(o) {
            this.__base(o);

            this.path = o.level;
            this.item = o.item || o;

            // delete elem/mod/val information from the item
            // because nevertheless a documentation file relies within
            // elem we create doc data within its block
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

                // Just grouping node which does nothing
                if (arch.hasNode(groupId)) {
                    group = arch.getNode(groupId);
                } else {
                    group = registry.getNodeClass('Node').create(groupId);

                    var magicNodeCl = registry.getNodeClass('MagicNode');

                    arch.setNode(group, arch.getParents(this).filter(function(p) {

                        return !(arch.getNode(p) instanceof magicNodeCl);
                    }), this);
                }


                // add doc node. It will apply bemhtml, bem.json and data.json and create block's html
                var o = {
                        root: this.root,
                        level: this.path,
                        path: this.__self.createNodePrefix({
                            root: this.root,
                            level: this.level,
                            item: this.item}),
                        /* pass the name of common bundle which contains bemhtml and bem.json common
                         for all blocks */
                        sourceBundle: this.getSourceBundleName(),
                        item: U.extend({}, _this.item)
                    },
                    docNodeCl = registry.getNodeClass(this.getDocNodeClass()),
                    docNodeId = docNodeCl.createId(o);

                if (!arch.hasNode(docNodeId)) {
                    arch.setNode(docNodeCl.create(o));
                }

                o = {
                    root: this.root,
                    level: this.path,
                    item: U.extend({}, _this.item),
                    path: this.__self.createNodePrefix({
                        root: this.root,
                        level: this.level,
                        item: this.item}),
                    levels: this.levels,
                    sources: this.sourceItems
                };

                var docSourceNodeCl = registry.getNodeClass(this.getDocSourceNodeClass()),
                    docSourceNodeId = docSourceNodeCl.createId(o);

                if (!arch.hasNode(docSourceNodeId)) {
                    // add source node for block which will create a data.json
                    arch.setNode(docSourceNodeCl.create(o));
                }

                arch.addParents(docNodeId, groupId)
                    .addChildren(docNodeId, docSourceNodeId);

                // getSourceBundleName() returns non empty string link DocNode to returned common bundle
                if (this.getSourceBundleName()) {
                    var cat = this.__self.createId({
                            root: this.root,
                            level: this.level,
                            item: {
                                block: this.getSourceBundleName()
                            }
                        }).slice(0, -1),

                        index = this.__self.createId({
                            root: this.root,
                            level: this.level,
                            item: {
                                block: 'index'
                            }
                        }).slice(0, -1);

                    // skip linking if this node is catalogue or index
                    if (groupId !== cat && groupId !== index) {
                        arch.addChildren(docNodeId, cat);
                    }
                }
            }
        },

        /**
         * Return node class name to use as DocNode.
         * @returns {string} node class name
         */
        getDocNodeClass: function() {
            return 'DocNode';
        },

        /**
         * Return node class name to use as SourceNode.
         * @returns {string}
         */
        getDocSourceNodeClass: function() {
            return 'DocSourceNode';
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


    /**
     * The node applies bemhtml, bem.json from the common bundle and data.json built by source node together and
     * writes block's html.
     * @class DocNode
     */
    registry.decl('DocNode', 'GeneratedFileNode', {

        __constructor : function(o) {
            this.source = o.path + '.data.json';

            this.__base(o);
            this.path += '.html';
            this.item = o.item;
            this.level = typeof o.level === 'string'? createLevel(o.level): o.level;
            this.sourceBundle = o.sourceBundle;
            this.rootLevel = createLevel(this.root);
        },

        /**
         * Read data.json and build html
         * @returns {*}
         */
        make: function() {
            return this.buildHtml(U.readFile(PATH.resolve(this.root, this.source)));
        },

        buildHtml: function(json) {
            var _this = this;

            return json.then(function(json) {
                json = JSON.parse(json);
                return _this.getTemplates()
                    .spread(function(BEMJSON, BEMHTML) {

                        var bemjson = BEMJSON.build({
                            block: 'global',
                            pageTitle: _this.item.block,
                            data: json,
                            environ: {
                                'id': 'site',
                                'name': _this.sourceBundle
                            }
                        });

                        return U.writeFile(
                            PATH.join(_this.root, PATH.dirname(_this.path), _this.item.block) + '.html',
                            BEMHTML.apply(bemjson));

                    });
            });
        },

        /**
         * Returns promise for array consisting of two items:
         * object returned by getBemjson() and object returned by getBemhtml().
         * @returns {Promise * Array}
         */
        getTemplates: function() {

            var prefix = this.level.getByObj({
                    block: this.sourceBundle
                });

            return Q.all([
                this.getBemjson(prefix),
                this.getBemhtml(prefix)
            ]);

        },

        /**
         * Read bem.json from the common bundle.
         * @param {String} prefix Prefix of the common bundle.
         * @returns {Promise * Function}
         */
        getBemjson : function(prefix) {

            var path = PATH.join(PATH.dirname(prefix), '_' + this.sourceBundle + '.bem.json.js');
            return U.readFile(path)
                .then(function(data) {
                    return ( new Function('global', 'BEM', '"use strict";' + data + ';return BEM.JSON;') )();
                });

        },

        /**
         * Read bemhtml from the common bundle.
         * @param {String} prefix Prefix of the common bundle.
         * @returns {Promise * Object}
         */
        getBemhtml : function(prefix) {

            var path = PATH.join(PATH.dirname(prefix), '_' + this.sourceBundle + '.bemhtml.js');
            return Q.resolve(require(path).BEMHTML);

        }

    }, {

        createId: function(o) {
            return this.__base(U.extend({}, o, {path: o.path + '.html'}));
        }
    });

    /**
     * The node generates data.json for the block's documentation. Input data is passed via
     * o.sources and consists of the items describing found documentation related files within the block.
     * @class DocSourceNode
     */
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

            var _this = this,
                json = {},
                content = this.scanExamples()
                    .then(function() {
                        return _this.sources.map(function(item) {
                            var content,
                                itemLevel = createLevel(item.level);
                            // item contains information about entity which applies to be documentation source
                            // (md, wiki, title.txt, examples)

                            if (item.tech !== 'examples') {
                                // for entities in desc.md, desc.wiki, title.txt techs
                                // we read their files and parse them. title.txt content is returned as is.
                                var path = itemLevel.getPathByObj(item, item.suffix.substring(1));

                                content = U.readFile(path)
                                    .then(function(c) {
                                        if (item.tech === 'desc.md') return MD(c);
                                        if (item.tech === 'desc.wiki') return SHMAKOWIKI.shmakowikiToBemjson(c);

                                        return c;
                                    });
                            } else {
                                content = _this._readExamples(item);
                            }

                            /**
                             *  build an object tree describing block and its elems, mods, vals
                             *
                             * {
                             *   name: 'block',
                             *   mods: [
                             *     {
                             *       name: 'mod',
                             *       vals: [
                             *         {
                             *           name: 'val1',
                             *           title: [
                             *             {
                             *               level: 'common.blocks', // level the title.txt was found on
                             *               content: 'content of the title.txt for this block.mod.val1'
                             *             }
                             *           ]
                             *
                             *         }
                             *       ],
                             *
                             *       title: [
                             *         {
                             *           level: 'common.blocks',
                             *           content: 'content of the title.txt for this block.mod'
                             *         }
                             *       ]
                             *     }
                             *   ],
                             *
                             *   description: [
                             *     {
                             *       level: 'desktop.blocks',
                             *       content: {} // bemjson content of md or wiki file for this block
                             *     }
                             *   ]
                             * }
                             *
                             * etc
                             */
                            var obj = _this._constructJson(json, item);

                            return content.then(function(content) {
                                var key = 'description';
                                if (item.tech === 'title.txt') key = 'title'
                                else if (item.tech === 'examples') key = 'examples';

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

        _readExamples: function(item) {

            // each block example is being put into block the documentation page
            var _this = this,
                exampleLevel = createLevel(
                    createLevel(item.level).getPathByObj(item, item.tech)
                );

            // scan for title.txt within example to use its content as description
            return Q.all(exampleLevel.getItemsByIntrospection().filter(function(item) {
                return item.tech === 'title.txt'
            })
            .map(function(exampleitem) {

                var examplePath = exampleLevel.getPathByObj(exampleitem, exampleitem.suffix.substring(1));

                return U.readFile(examplePath)
                    .then(function(exampleDesc) {
                        var url = PATH.join(
                            _this.rootLevel.getRelPathByObj({block: item.block, tech: 'examples'}, 'examples'),
                            _this.level.getRelByObj(exampleitem));

                        // content var will contain array of {url, title) objects with
                        // example link and description
                        return {
                            url: url,
                            title: exampleDesc
                        };
                    });
            }));
        },

        _constructJson: function(json, item) {
            var getObj = function() {
                    return {
                        // JSON.stringify() will serialize object properties into array
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
                };

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

            return obj;
        },

        /**
         * Scan block levels for examples and push them into sources property.
         * @returns {Promise * undefined}
         */
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
}
