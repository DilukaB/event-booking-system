const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname);

// Packages that need to be transpiled by Babel
const babelLoaderConfiguration = {
  test: /\.(js|jsx|ts|tsx)$/,
  include: [
    path.resolve(appDirectory, 'index.js'),
    path.resolve(appDirectory, 'App.js'),
    path.resolve(appDirectory, 'src'),
    // Add RN packages that need transpiling
    path.resolve(appDirectory, 'node_modules/react-native-uncompiled'),
    path.resolve(appDirectory, 'node_modules/@react-navigation'),
    path.resolve(appDirectory, 'node_modules/@react-native'),
    path.resolve(appDirectory, 'node_modules/react-native-safe-area-context'),
    path.resolve(appDirectory, 'node_modules/react-native-screens'),
    path.resolve(appDirectory, 'node_modules/@react-native-async-storage'),
    path.resolve(appDirectory, 'node_modules/react-native-image-picker'),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets: ['@react-native/babel-preset'],
      plugins: ['@babel/plugin-proposal-class-properties'],
    },
  },
};

// Image/font loader
const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/,
  use: {
    loader: 'url-loader',
    options: { name: '[name].[ext]' },
  },
};

module.exports = {
  entry: path.join(appDirectory, 'index.web.js'),
  output: {
    path: path.resolve(appDirectory, 'web-build'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  resolve: {
    extensions: ['.web.js', '.web.jsx', '.js', '.jsx', '.ts', '.tsx'],
    alias: {
      'react-native$': 'react-native-web',
    },
  },
  module: {
    rules: [babelLoaderConfiguration, imageLoaderConfiguration],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(appDirectory, 'public/index.html'),
    }),
  ],
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
    open: true,
  },
  mode: 'development',
};
