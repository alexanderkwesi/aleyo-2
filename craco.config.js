// craco.config.js
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Ignore the deprecation warning
      webpackConfig.ignoreWarnings = [
        {
          message: /fs\.F_OK is deprecated/,
        },
      ];
      
      // Add environment variables
      webpackConfig.plugins.push(
        new webpack.DefinePlugin({
          'process.env.REACT_APP_API_URL': JSON.stringify(
            process.env.REACT_APP_API_URL || 'http://35.230.74.10:0'
          ),
        })
      );
      
      return webpackConfig;
    },
  },
};
