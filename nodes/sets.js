/**
 * @fileOverview Узлы для сборки наборов БЭМ-сущностей (sets)
 */

'use strict';

var FS = require('fs'),
    PATH = require('path'),
    BEM = require('bem'),
    Q = require('q'),
    _ = require('underscore'),
    LOGGER = BEM.logger,

    createLevel = BEM.createLevel,

    /** Id главного узла сборки наборов */
    SETS_NODE_ID = 'sets';


module.exports = function(registry) {

    registry.decl('SetsNode', 'Node', {

        __constructor : function(o) {
             this.__base(o);

             this.arch = o.arch;
             this.root = o.root;
             this.rootLevel = createLevel(this.root);
        },

        alterArch : function(parent, children) {
            var _t = this,
                arch = _t.arch;

            return Q.resolve()
                .then(function() {
                    return _t.createCommonSetsNode(parent);
                })
                .then(function(common) {
                    return _t.createSetsLevelNodes(
                        parent ? [common].concat(parent) : common,
                        children);
                })
                .then(function() {
                    return arch;
                })
                .fail(LOGGER.error);
        },

        createCommonSetsNode : function(parent) {
            var node = registry.getNodeClass('Node').create(SETS_NODE_ID);
            this.arch.setNode(node, parent);

            return node.getId();
        },

        createSetsLevelNodes : function(parents, children) {
            var sets = this.getSets();
            return Object.keys(sets)
                .map(function(name) {

                    var node = registry.getNodeClass('SetsLevelNode')
                        .create({
                            root    : this.root,
                            level   : this.rootLevel,
                            item    : { block : name, tech : 'sets' },
                            sources : sets[name]
                        });

                    this.arch.setNode(node);

                    parents && this.arch.addParents(node, parents);
                    children && this.arch.addChildren(node, children);

                    return node.getId();

                }, this);
        },

        /**
         * @returns {Object} Описание наборов `{ name : [level1, level2] }`
         */
        getSets : function() {
            return {};
        }

    });


    registry.decl('SetsLevelNode', 'GeneratedLevelNode', {

        alterArch : function() {
            var base = this.__base();
            return function() {

                var _t = this,
                    arch = _t.ctx.arch;

                return Q.when(base.call(this), function(level) {
                    var realLevel = arch.getChildren(level),
                        getNodeClassForTech = _t.getNodeClsForTech.bind(_t),
                        decls = _t.scanSources();

                    decls.unshift({
                        block: 'catalogue',
                        tech: '_catalogue',
                        level: '',
                        suffix: '_catalogue'
                    });

                    // BlockNodeClass = registry.getNodeClass('BlockNode');
console.log('decls: %j', decls)
                    decls.forEach(function(item) {
                        // creating block node (source) for item
                        var o = {
                                root  : this.root,
                                item  : item,
                                level : item.level
                            };
console.log('declitem %s', item.block)
                        // creating levels node for item (examples, tests, whatever)
                        var levelNode = (_t['create-' + item.tech + '-node'] || _t['create-default-level-node']).call(_t, item, level, realLevel),
                            source = createLevel(item.level).getPathByObj(item, item.suffix.substring(1));

                        if(FS.existsSync(source)) {
                            console.log('source  %s', source);
                            levelNode.sources.push(source);
                            levelNode.sourceItems && levelNode.sourceItems.push(item);
                        }
                    }, _t);

                    return Q.when(_t.takeSnapshot('After SetsLevelNode alterArch ' + _t.getId()));
                });

            };

        },

        getSourceItemsMap : function() {
            return {
//                examples : ['examples'],
                tests : ['tests', 'test.js'],
                docs : ['desc.md', 'title.txt']
            };
        },

        getSourceItemTechs : function() {
            var map = this.getSourceItemsMap();

            var r = _.uniq(Object.keys(map).reduce(function(techs, name) {
                    return techs.concat(map[name]);
                }, []));

            return r;
        },

        getNodeClsForTech : function(suffix) {
            var suffix2class = {
                'examples' : 'ExamplesLevelNode',
                'test.js'  : 'TestsLevelNode',
                'desc.md'  : 'DocLevelNode',
                'title.txt'  : 'DocLevelNode',
                '_catalogue': 'DocCatalogueNode'
            };
            return suffix2class[suffix];
        },

        'create-default-level-node': function(item, parents, children) {
            var arch = this.ctx.arch,
                o = {
                    root  : this.root,
                    level : this.path,
                    item  : this.getSetItem(item)
                };

            var LevelNodeCls = registry.getNodeClass(this.getNodeClsForTech(item.tech)),
                levelnid = LevelNodeCls.createId(o),
                levelNode;

            console.log('levelid %s', levelnid);

            if(arch.hasNode(levelnid)) {
                levelNode = arch.getNode(levelnid);
            } else {
                levelNode = LevelNodeCls.create(o);
                arch.setNode(levelNode, parents, children);
            }

            return levelNode;
        },

        '1create-examples-node': function(item, parents, children) {

        },

        'create-desc.md-node': function(item, parents, children) {
            var level = this['create-default-level-node'].apply(this, arguments);

            this.ctx.arch.addChildren(level, 'desktop.sets/catalogue.doc*');

            return level;
        },

        '1create-_catalogue-node': function(item, parents, children) {

        },

        getSetItem: function(item) {
            return BEM.util.extend({}, item, {tech: this.getSetTech(item.tech)});
        },

        getSetTech: function(sourceTech) {
            var sourceToSet = {
                'examples': 'examples-set',
                'test.js': 'tests-set'
            };

            return sourceToSet[sourceTech];
        }

    });

};
