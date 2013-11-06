exports.baseLevelPath = require.resolve('bem/lib/levels/simple');
exports.getTechs = function() {
    var techs;
    techs = {
        'docs': 'bem/lib/techs/v2/docs.js',
        'md': 'bem/lib/tech/index.js'
    };
    return techs;
};
