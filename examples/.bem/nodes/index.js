'use strict';

exports.extendMake = function(registry) {
    require('./arch').extendMake(registry);
    require('./bundles').extendMake(registry);
    require('./examples').extendMake(registry);
    require('./tests').extendMake(registry);
};
