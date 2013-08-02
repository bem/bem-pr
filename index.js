var PATH = require('path');

exports.extendMake = function(registry) {
    require('./nodes')(registry);
};

exports.getTestLevelPath = function() {
    return PATH.join(__dirname, 'test.blocks');
};
