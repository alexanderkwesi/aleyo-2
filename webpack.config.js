const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'static/js/[name].[contenthash:8].js',
    publicPath: '/',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      favicon: './public/favicon.ico',
    }),
    // ✅ CORRECT: Only define specific environment variables
    new webpack.DefinePlugin({
      'process.env.REACT_APP_API_URL': JSON.stringify(
        process.env.REACT_APP_API_URL || 'https://aleyo-2-1.onrender.com' || "http://35.230.74.10:0"
      ),
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV || 'development'
      ),
      'process.env.PUBLIC_URL': JSON.stringify(
        process.env.PUBLIC_URL || ''
      ),
    }),
  ],
  devServer: {
    historyApiFallback: true,
    port: 3000,
    hot: true,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
};
