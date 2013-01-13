var BEM = require('bem'),
    PATH = require('path'),
    FS = require('fs'),
    
    Q = BEM.require('qq'),
    MKDIRP = BEM.require('mkdirp'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),
    registry = BEM.require('./nodesregistry'),
    nodes = BEM.require('./nodes/node'),
    magicNodes = BEM.require('./nodes/magic'),
    levelNodes = BEM.require('./nodes/level'),
    blockNodes = BEM.require('./nodes/block'),
    bundleNodes = BEM.require('./nodes/bundle'),
    createNodes = BEM.require('./nodes/create'),
    fileNodes = BEM.require('./nodes/file'),
    
    SetsNodeName = exports.SetsNodeName = 'SetsNode',
    SetsLevelNodeName = exports.SetsLevelNodeName = 'SetsLevelNode',
    ExamplesLevelNodeName = exports.ExamplesLevelNodeName = 'ExamplesLevelNode',
    ExampleSourceNodeName = exports.ExampleSourceNodeName = 'ExampleSourceNode',
    ExampleNodeName = exports.ExampleNodeName = 'ExampleNode',
    
    createLevel = BEM.createLevel;


Object.defineProperty(exports, SetsNodeName, {
    get : function() {
        return registry.getNodeClass(SetsNodeName);
    }
});


registry.decl(SetsNodeName, nodes.NodeName, {
    
    __constructor : function(o) {
        
         this.__base(o);
         
         this.arch = o.arch;
         this.root = o.root;
         this.rootLevel = createLevel(this.root);
         
    },
    
    alterArch : function(parent, children) {

        var _t = this,
            arch = _t.arch;

        return Q.step(
                function() {
                    return Q.call(_t.createSetsLevelNodes, _t, parent, children);
                })
                .then(function() {
//                    LOGGER.info(arch.toString());
                    return arch;
                });
        
    },
    
    createSetsLevelNodes : function(parent, children) {
        
        var sets = this.getSets();
        return Object.keys(sets).map(function(name) {
            
            var node = registry.getNodeClass(SetsLevelNodeName).create({
                root    : this.root,
                level   : this.rootLevel,
                item    : { block : name },
                sources : sets[name]
            });
            
            this.arch.setNode(node);
            
            parent && this.arch.addParents(node, parent);
            children && this.arch.addChildren(node, children);
            
            return node.getId();
            
        }, this);
        
    },
    
    getSets : function() {
        // noop
        return { };
    }
    
}, {
    
    create : function(o) {
        return new this(o);
    }
    
});


var GeneratedLevelNodeName = 'GeneratedLevelNode';

registry.decl(GeneratedLevelNodeName, magicNodes.MagicNodeName, {
    
    __constructor : function(o) {
        
        Object.defineProperty(this, 'level', {
            get : function() {
                if(typeof this._level === 'string') {
                    this._level = createLevel(PATH.resolve(this.root, this._level));
                }
                return this._level;
            }
        });
        
        this._level = o.level;
        this.item = o.item;
        this.techName = o.techName;

        this.__base(U.extend({ path : this.__self.createPath(o) }, o));

    },
    
    make : function() {
        return this.ctx.arch.withLock(this.alterArch(), this);
    },
    
    alterArch : function() {
        
        var ctx = this.ctx;
        
        return function() {
            
            var arch = ctx.arch,
                levelNode,
                
                snapshot1 = this.takeSnapshot('Before GeneratedLevelNode alterArch');

            if(arch.hasNode(this.path)) {
                levelNode = arch.getNode(this.path);
            } else {
                if(FS.existsSync(this.path)) {
                    levelNode = new fileNodes.FileNode({
                        root : this.root,
                        path : this.path
                    });
                } else {
                    levelNode = new createNodes.BemCreateNode({
                        root     : this.root,
                        level    : this.level,
                        item     : this.item,
                        techName : this.techName
                    });
                }
                
                arch.setNode(levelNode, arch.getParents(this));
            }
            
            return Q.all([snapshot1, this.takeSnapshot('After GeneratedLevelNode alterArch ' + this.getId())])
                .then(function() {
                    return levelNode.getId();
                });
            
        };
        
    }
    
}, {
    
    create : function(o) {
        return new this(o);
    },
    
    createPath : function(o) {

        var level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;

        return level
            .getTech(o.techName)
            .getPath(this.createNodePrefix(U.extend({}, o, { level: level })));

    },
    
    createNodePrefix: function(o) {

        // FIXME: hardcoded NodePrefix
//        return serializeBemItem(PATH.relative(o.root, o.level.dir), o.item);
        var level = typeof o.level === 'string'?
                createLevel(PATH.resolve(o.root, o.level)) :
                o.level;

        return PATH.relative(o.root, level.getByObj(o.item));

    }
    
});


registry.decl(SetsLevelNodeName, GeneratedLevelNodeName, {
    
    __constructor : function(args) {
        
        var o = U.extend(this.getDefaults(), args);
        
        /**
         * Список уровней из которых состоит набор (set)
         * @type Array
         */
        this.sources = o.sources;
        
        this.__base(o);
        
    },
    
    alterArch : function() {
        
        var base = this.__base();
        return function() {
            
            var _t = this;
            return Q.when(base.call(this))
                .then(function(levelNode) {
                    
                    var arch = _t.ctx.arch,
                        decls = _t.scanSources();
                    
                    decls.forEach(function(item) {
                        
                        var o = {
                            root     : this.root,
                            level    : this.path,
                            item     : item,
                            techName : item.tech
                        };
                        
                        var exampleNode = registry
                            .getNodeClass(ExamplesLevelNodeName)
                            .create(o);
                        
                        arch.setNode(exampleNode)
                            .addChildren(exampleNode, [this, levelNode]);
                        
                        // TODO: move to method
                        o = {
                            root  : this.root,
                            item  : item,
                            level : item.level
                        };
                            
                        var blockNode, 
                            id = blockNodes.BlockNode.createId(o);
                        
                        if(arch.hasNode(id)) {
                            blockNode = arch.getNode(id);
                        } else {
                            blockNode = new blockNodes.BlockNode(o);
                        }
                        
                        arch.setNode(blockNode, exampleNode);
                        
                        // XXX: hardcore
                        exampleNode._blockNode = blockNode;
                        
                    }, _t);
                    
                    return _t.takeSnapshot('After SetsLevelNode alterArch ' + _t.getId());
                    
                });
            
        };
        
    },
    
    getDefaults : function() {
        return {
            techName : 'sets'
        };
    },
    
    getSourceItemTechs : function() {
        return [
            'examples',
            'test.js'
        ];
    },
    
    getSources : function() {
        
        if(!this._sources) {
            var absolutivize = PATH.resolve.bind(null, this.root);
            
            this._sources = this.sources.map(function(level) {
                    if(typeof level === 'string')
                        return createLevel(absolutivize(level));
                    return level;
                });
        }
        
        return this._sources;
        
    },
    
    scanSources : function() {
        
        return this.getSources()
            .map(this.scanSourceLevel.bind(this))
            .reduce(function(decls, item) {
                return decls.concat(item);
            }, []);
        
    },
    
    scanSourceLevel : function(level) {
        
        var relativize = PATH.relative.bind(null, this.root),
            techs = this.getSourceItemTechs();
        
        return level.getItemsByIntrospection()
            .filter(function(item) {
                return ~techs.indexOf(item.tech);
            })
            .map(function(item) {
                item.level = relativize(level.dir);
                // XXX: key?
                item.key = serializeBemItem(item.level, item);
                return item;
            });
        
    }
    
}, {
    
    create : function(o) {
        return new this(o);
    }
    
});


registry.decl(ExamplesLevelNodeName, GeneratedLevelNodeName, {
    
    __constructor : function(o) {
        
        this.__base(o);
        this.rootLevel = createLevel(this.root);
        
    },
    
    alterArch : function() {
        
        var base = this.__base();
        return function() {
            
            var _t = this,
                arch = _t.ctx.arch;
            return Q.when(base.call(_t), function(levelNode) {
                
                var decls = _t.scanSourceLevel(),
                    id = '';
                
                decls.forEach(function(item) {
                    
                    // TODO: meta node
                    var source = PATH.relative(this.root, createLevel(
                            this._blockNode.level.getPathByObj(
                                    this.item, this.item.tech)).getPathByObj(item, item.tech)),
                        srcNode = registry.getNodeClass(ExampleSourceNodeName).create({
                            root   : this.root,
                            level  : this.path,
                            item   : item,
                            source : source
                        });
                    
                    arch.setNode(srcNode).addChildren(srcNode, [this, levelNode, _t._blockNode]);
                    
                    var sourceNode;
                    if(arch.hasNode(source)) {
                        sourceNode = arch.getNode(source);
                    } else {
                        sourceNode = new fileNodes.FileNode({
                            root : this.root,
                            path : source
                        });
                    }
                    
                    arch.setNode(sourceNode, srcNode);
                    
                    var bundleNode = registry.getNodeClass(ExampleNodeName).create({
                        root   : this.root,
                        source : PATH.dirname(source),   // FIXME: hack
                        level  : this.path,
                        item   : item
                    });
                    
                    arch.setNode(bundleNode).addChildren(bundleNode, [this, srcNode]);
                    
                }, _t);
                
//                LOGGER.info(arch.toString());
                
                return _t.takeSnapshot('After ExamplesLevelNode alterArch ' + _t.getId());;
                
            });
            
        };
        
    },
    
    
    getSourceItemTechs : function() {
        return ['bemjson.js'];
    },
    
    scanSourceLevel : function(level) {
        
        var sourceTechs = this.getSourceItemTechs();
        
        return createLevel(this._blockNode.level.getPathByObj(this.item, this.item.tech))
            .getItemsByIntrospection().filter(function(item) {
                return ~sourceTechs.indexOf(item.tech);
            });
        
    }
    
});


registry.decl(ExampleSourceNodeName, fileNodes.GeneratedFileNodeName, {
    
    __constructor : function(o) {
        
        this.level = typeof o.level === 'string'?
            createLevel(PATH.resolve(o.root, o.level)) :
            o.level;
        this.item = o.item;
        this.source = o.source;

        this.__base(U.extend({ path: this.__self.createPath(o) }, o));
    
    },
    
    make : function() {

        var _t = this;
        return U.readFile(PATH.resolve(this.root, this.source))
            .then(function(data) {

                MKDIRP.sync(PATH.dirname(_t.getPath()));
                
                return U.writeFileIfDiffers(_t.getPath(), data)
                    .then(function() {
                        return _t.path;
                    });

            });

    }
    
}, {
    
    create : function(o) {
        return new this(o);
    },
    
    createPath : function(o) {

        var level = typeof o.level === 'string'?
                createLevel(PATH.resolve(o.root, o.level)) :
                o.level;

        return level
            .getTech(o.item.tech)
            .getPath(this.createNodePrefix(o));
        
    },
    
    createNodePrefix : function(o) {
        
//        return serializeBemItem(PATH.relative(o.root, o.level), o.item);
        var level = typeof o.level === 'string'?
                createLevel(PATH.resolve(o.root, o.level)) :
                o.level;

        return PATH.relative(o.root, level.getByObj(o.item));

    }
    
});


registry.decl(ExampleNodeName, bundleNodes.BundleNodeName, {
    
    __constructor : function(o) {
        
        this.__base(o);
        
        this.source = o.source; // TODO source -> sourceLevel
        this.rootLevel = createLevel(this.root);
        
    },
    
    getTechs : function() {
        
        return [
            'bemjson.js',
            'bemdecl.js',
            'deps.js',
            'bemhtml',
            'css',
            'js',
            'html'
            ];
        
    },
    
    getSourceNodePrefix : function() {
        
        if (!this._sourceNodePrefix) {
            this._sourceNodePrefix = this.__self.createNodePrefix({
                root: this.root,
                level: this.source,
                item: this.item
            });
        }
        return this._sourceNodePrefix;
        
    },
    
    getLevels: function(tech) {
        return (this.level.getConfig().bundleBuildLevels || [])
            .concat([this.rootLevel.getTech('blocks').getPath(this.getSourceNodePrefix())]);
    },
    
    createTechNode: function(tech, bundleNode, magicNode) {

        // FIXME: example source is hardcoded
        // NOTE: we use `ExampleSourceNode` to build example's source bundle
        if(tech === 'bemjson.js')
            return false;
        
        return this.__base.apply(this, arguments);
      
    },
    
}, {
    
    create : function(o) {
        return new this(o);
    }
    
});


function serializeBemItem() {
    return [].splice.call(arguments, 0)
        .reduce(function(keys, item) {
            
            if(typeof item === 'string') {
                item = item.trim();
                if(!item)
                    return keys;
                item = { block : item };
            };
            
            keys.push(U.bemKey(item));
            return keys;
            
        }, [])
        .join('/');
}

function parseBemItem(key) {
    return (key + '').split('/').map(function(part) {
            return U.bemParseKey(part);
        });
} 
