'use strict';

var PATH = require('path'),
    DEPS = require('bem/lib/techs/deps.js'),
    BEM = require('bem'),
    Q = BEM.require('q');

exports.API_VER = 2;

exports.techMixin = {

    getBuildSuffixesMap: function() {
        return {
            'test.js': ['test.js', 'vanilla.js', 'js', 'browser.js', 'bemhtml']
        };
    },

    getBuildResult: function(files, suffix, output, opts) {
        var context = this.context,
            ctxOpts = context.opts,
            _this = this;

        return ctxOpts.declaration
            .then(function(decl) {
                var testJsResults = _this.getTechBuildResults('test.js', decl, context, output, opts),
                    browserJsResults = _this.getTechBuildResults('browser.js', decl, context, output, opts),
                    bemhtmlDecl = new DEPS.Deps(),
                    depsByTechs = decl.depsByTechs || {},
                    depsByTechsJs = depsByTechs.js || {},
                    depsByTechsTestJs = depsByTechs['test.js'] || {};

                bemhtmlDecl.parse(depsByTechsJs.bemhtml || []);
                bemhtmlDecl.parse(depsByTechsTestJs.bemhtml || []);

                bemhtmlDecl = { deps: (bemhtmlDecl.serialize()['bemhtml'] || {})['bemhtml'] || [] };

                var bemhtmlResults = bemhtmlDecl.deps.length ?
                    _this.getTechBuildResults('bemhtml', bemhtmlDecl, context, output, opts) :
                    '';

                return Q.all([testJsResults, browserJsResults, bemhtmlResults])
                    .spread(function(testJsResults, browserJsResults, bemhtmlResults) {
                        return [
                            browserJsResults['js'].join(''),
                            testJsResults['test.js'].join(''),
                            bemhtmlResults['bemhtml.js']
                        ].join('');
                    });

            });
    },

    getTechBuildResults: function(techName, decl, context, output, opts) {
        opts.force = true;
        var tech = context.createTech(techName);

        if (tech.API_VER < 2) {
            return Q.reject(new Error(this.getTechName() +
                ' can’t use v1 ' + techName + ' tech to concat ' + techName + ' content. ' +
                'Configure level to use v2 ' + techName + '.'));
        }

        return tech.getBuildResults(
            tech.transformBuildDecl(decl),
            context.getLevels(),
            output,
            opts
        );
    }

};
