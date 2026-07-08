// craco.config.js
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find the DefinePlugin instance
      const definePlugin = webpackConfig.plugins.find(
        (plugin) => plugin.constructor.name === 'DefinePlugin'
      );

      if (definePlugin) {
        // Get existing definitions
        const existingDefinitions = definePlugin.definitions || {};
        
        // Add your custom definitions WITHOUT overriding process.env entirely
        definePlugin.definitions = {
          ...existingDefinitions,
          'process.env.REACT_APP_API_URL': JSON.stringify(
            process.env.REACT_APP_API_URL || 'https://aleyo-2-1.onrender.com'
          ),
        };
      } else {
        // If no DefinePlugin exists, add a new one
        webpackConfig.plugins.push(
          new webpack.DefinePlugin({
            'process.env.REACT_APP_API_URL': JSON.stringify(
              process.env.REACT_APP_API_URL || 'https://aleyo-2-1.onrender.com'
            ),
          })
        );
      }

      return webpackConfig;
    },
  },
};
