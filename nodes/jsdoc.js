'use strict';

var PATH = require('path'),
    CP = require('child_process'),
    VM = require('vm'),
    UTIL = require('util'),
    BEM = require('bem'),
    Q = BEM.require('q'),
    VOW = require('vow'),
    U = BEM.util,
    LOGGER = BEM.logger,
    createLevel = BEM.createLevel;

/**
 * Declare nodes responsible of building the documentation from jsdoc
 */
module.exports = function(registry) {

    /**
     * Inherited from the DocLevelNode this node is used as entry point to build jsdoc documentation for block.
     * After execution it will extend the nodes tree with JsDocBundleNode and JsDocSourceNode instances.
     * @class DocCatalogueNode
     */
    registry.decl('JsDocLevelNode', 'DocLevelNode', {

        __constructor: function(o) {
            this.__base(o);
        },

        getDocNodeClass: function() {
            return 'JsDocNode';
        },

        getDocSourceNodeClass: function() {
            return 'JsDocSourceNode';
        },

        getSourceBundleName: function() {
            return 'jscatalogue';
        }

    }, {

        createId: function(o) {

            return PATH.dirname(this.createPath({
                root: o.root,
                level: o.level,
                item: {
                    block: o.item.block
                }
            })) + '.jsdoc' + '*';
        }
    });

    /**
     * The node does only create a source file to build a bundle. Will create a jsdoc.json file on execution.
     * @class JsDocSourceNode
     */
    registry.decl('JsDocSourceNode', 'GeneratedFileNode', {

        __constructor: function(o) {
            o.path += '.jsdoc.json';
            this.__base(o);
            this.rootLevel = createLevel(this.root);
            this.sources = o.sources;
        },

        make: function() {

            var _this = this;

            return Q.all([this.getSourceContent(), U.mkdirp(PATH.dirname(this.path))])
                .spread(function(content) {
                    return U.writeFile(_this.path, content);
                })
        },

        /**
         * Return the string content to write into the source file.
         * @returns {string} Content.
         */
        getSourceContent: function() {
            var d = Q.defer(),
                paths = this.sources.map(function(item) {
                    return createLevel(item.level).getPathByObj(item, item.suffix.substring(1));
                }),

                // execute jsdoc, pass block's js files paths in arguments
                jsdoc = CP.spawn(
                    PATH.resolve(__dirname, '../node_modules/.bin/jsdoc'), [
                        '-c', PATH.resolve(__dirname, '../jsdoc.conf.json'),
                        '-t', PATH.resolve(__dirname, '../node_modules/jsdoc-bem/templates/docjson')
                    ].concat(paths),
                    {cwd: this.root}
                );

            var content = '',
                err = '';

            jsdoc.stdout.on('data', function(data) {
                content += data;
            });

            jsdoc.stderr.on('data', function(data) {
                err += data;
            });

            jsdoc.on('close', function(code) {
                if (code !== 0) return d.reject('Error while processing files ' + paths + ':' + err);
                d.resolve(content);
            })

            return d.promise;
        }

    });

    /**
     * Builds block's jsdoc.html by applying together bemtree and bemhtml from the common bundle with block's jsdoc.json.
     * @class JsDocNode
     */
    registry.decl('JsDocNode', 'DocNode', {

        __constructor: function(o) {

            var path = o.path;
            o.path += '.jsdoc';

            this.__base(o);

            this.source = path + '.jsdoc.json';
        },

        /**
         * Overriden. Read jsdoc.json, generate a json using the common bemtree. Then apply bemhtml and write result
         * to file.
         * @param json
         * @returns {Promise * undefined}
         */
        buildHtml: function(json) {
            var _this = this;

            return json.then(function(json) {
                json = JSON.parse(json);
                return _this.getTemplates()
                    .spread(function(BEMTREE, BEMHTML) {

                        try {
                            return BEMTREE.apply({
                                block: 'page',
                                data: json
                            })
                            .then(function(bemjson) {
                                try {
                                    var html = BEMHTML.apply(bemjson);
                                } catch (err) {
                                    return Q.reject(UTIL.format('Failed to apply bemhtml to the data file %s\n%s', _this.source, err.stack));
                                }

                                return U.writeFile(PATH.resolve(_this.root, _this.path), html);
                            });
                        } catch (err) {
                            return Q.reject(UTIL.format('Failed to apply bemtree to the data file %s\n%s', _this.source, err.stack));
                        }

                    });
            });
        },

        /**
         * Overriden. Return bemtree object by reading bemtree.js from the common bundle.
         * @param prefix
         * @returns {Promise * Object}
         */
        getBemjson : function(prefix) {

            var path = PATH.join(PATH.dirname(prefix), this.sourceBundle + '.bemtree.js');
            return U.readFile(path)
                .then(function(data) {
                    var context = VM.createContext({
                        console: console,
                        Vow: VOW
                    });

                    try {
                        VM.runInContext(data, context);
                    } catch (err) {
                        return Q.reject('Failed to evaluate bemtree file %s', path);
                    }

                    return context.BEMTREE;
                });

        }

    });
}
