'use strict';

exports.extendMake = function (registry) {
    registry.decl('Arch', {

        blocksLevelsRegexp : /^.+?\.blocks$/,
        bundlesLevelsRegexp : /^.+?\.bundles$/

    });
};

