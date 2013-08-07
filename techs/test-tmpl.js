var BEM = require('bem'),
    PATH = require('path');

exports.techMixin = {

    getCreateResult : function(path, suffix, vars) {

        var envProps = JSON.parse(process.env.__tests || '{}')[PATH.dirname(path)] || {};

        return BEM.template.process([
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
        ], {
            BundleName: envProps.BundleName || vars.BlockName,
            TmplContent: envProps.TmplContent || ''
        });
    },

    getCreateSuffixes : function() {
        return ['bemjson.js'];
    }

};
