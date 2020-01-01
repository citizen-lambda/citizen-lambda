const BrotliPlugin = require('brotli-webpack-plugin');

module.exports = config => {
  process.env.BROTLI === 'true' &&
    config.plugins.push(
      new BrotliPlugin({
        asset: '[path].br',
        test: /\.(js|css|svg|txt|jpg|jpeg|png)$/,
        minRatio: 0
      })
    );

  return config;
};
