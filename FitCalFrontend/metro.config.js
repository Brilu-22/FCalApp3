const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Reduce watcher limits
config.watcher = {
  ...config.watcher,
  healthCheck: {
    enabled: false,
  },
  watchman: {
    deferStates: ['hg.update'],
  },
};

module.exports = config;
