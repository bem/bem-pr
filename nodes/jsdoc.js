'use strict';

var PATH = require('path'),
    CP = require('child_process'),
    BEM = require('bem'),
    Q = BEM.require('q'),
    U = BEM.util,
    createLevel = BEM.createLevel;

module.exports = function(registry) {

    registry.decl('JsDocLevelNode', 'DocLevelNode', {

        __constructor: function(o) {
            this.__base(o);
        },

        getDocNodeClass: function() {
            return 'JsDocBundleNode';
        },

        getDocSourceNodeClass: function() {
            return 'JsDocSourceNode';
        },

        getSourceBundleName: function() {
            return null;
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

    registry.decl('JsDocSourceNode', 'GeneratedFileNode', {

        __constructor: function(o) {
            o.path += '.jsdoc.json';
            this.__base(o);
            this.rootLevel = createLevel(this.root);
            this.sources = o.sources;
        },

        make: function() {

            var _this = this;

            return Q.all([U.mkdirp(PATH.dirname(this.path)), this.getSourceContent()])
                .spread(function(mkdir, content) {
                    return U.writeFile(_this.path, content);
                })
        },

        getSourceContent: function() {
            var d = Q.defer(),
                paths = this.sources.map(function(item) {
                    return createLevel(item.level).getPathByObj(item, item.suffix.substring(1));
                }),

                jsdoc = CP.spawn(
                    PATH.resolve(__dirname, '../node_modules/.bin/jsdoc'), [
                        '-c', PATH.resolve(__dirname, '../jsdoc.conf.json'),
                        '-t', PATH.resolve(__dirname, '../node_modules/jsdoc-bem/templates/docjson')
                    ].concat(paths),
                    { cwd: this.root }
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

    registry.decl('JsDocBundleNode', 'Node', {

        __constructor: function(o) {
            this.id = o.path + '.jsdoc.bundle';
        }
    });
}
