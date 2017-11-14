// @flow

const blacklist = require('./node_modules/metro-bundler/src/blacklist');
const path = require('path');
module.exports = {
  getProjectRoots() {
    return [__dirname, path.resolve(__dirname, '..')];
  },
  getProvidesModuleNodeModules() {
    return [
      'react-native',
      'react',
      'lodash'
    ];
  },
  getBlacklistRE() {
    return blacklist([
      new RegExp(
        `^${escape(path.resolve(__dirname, '..', 'node_modules'))}\\/.*$`
      ),
      new RegExp(
        `^${escape(path.resolve(__dirname, 'node_modules', 'xmlbuilder', 'node_modules', 'lodash'))}\\/.*$`
      ),
    ]);
  },
};
