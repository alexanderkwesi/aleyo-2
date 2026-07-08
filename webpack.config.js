// webpack.config.js
const webpack = require('webpack');

module.exports = {
  // ... other config
  plugins: [
    // ✅ CORRECT - Only define specific environment variables
    new webpack.DefinePlugin({
      'process.env.REACT_APP_API_URL': JSON.stringify(
        process.env.REACT_APP_API_URL || 'https://aleyo-2-1.onrender.com'
      ),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
  ],
};
