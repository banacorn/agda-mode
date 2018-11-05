const path = require('path');

module.exports = {
  target: "electron-main",
  entry: './lib/js/src/agda-mode.js',
  devtool: 'source-map',
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, 'lib/js/'),
    filename: 'bundled.js',
  },
  target: 'node',
  externals: {
    atom: 'atom'
  }
};
