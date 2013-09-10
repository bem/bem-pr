'use strict';

var BEM = require('bem'),
    PATH = require('path');

exports.techMixin = {

    getEnvProps: function(path) {
        return JSON.parse(process.env.__tests || '{}')[PATH.dirname(path)] || {};
    },

    getTemplate: function() {
        return [
            '({',
            '    block: "page",',
            '    head: [',
            '        { elem: "css", url: "_{{bemBundleName}}.css", ie: false },',
            '        { elem: "js", url: "_{{bemBundleName}}.test.js" }',
            '    ],',
            '    content: {',
            '        block: "test",',
            '        content: {{bemTmplContent}}',
            '    }',
            '})'
        ];
    },

    getTemplateData: function(env, vars, suffix) {
        return {
            BundleName: env.BundleName || vars.BlockName,
            TmplContent: env.TmplContent || ''
        };
    },

    getCreateResult : function(path, suffix, vars) {
        return BEM.template.process(
            this.getTemplate(),
            this.getTemplateData(this.getEnvProps(path), vars, suffix));
    },

    getCreateSuffixes : function() {
        return ['bemjson.js'];
    }

};
