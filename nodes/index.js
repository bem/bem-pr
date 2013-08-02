module.exports = function(registry) {
    require('./common')(registry);
    require('./examples')(registry);
    require('./tests')(registry);
    require('./sets')(registry);
};
