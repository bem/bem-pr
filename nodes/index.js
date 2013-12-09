'use strict';

module.exports = function(registry) {
    require('./common')(registry);
    require('./examples')(registry);
    require('./tests')(registry);
    require('./sets')(registry);
    require('./doc')(registry);
    require('./catalogue')(registry);
    require('./toc')(registry);
    require('./jsdoc')(registry);
    require('./jscatalogue')(registry);
};
