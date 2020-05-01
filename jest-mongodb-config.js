module.exports = {
  mongodbMemoryServerOptions: {
    instance: {
      db_name: 'jest'
    },
    binary: {
      version: '4.0.3',
      skipMD5: true
    },
    autoStart: false
  }
};
