'use strict';

var nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = {
    entry: './src/toolbar.js',
    mode: 'production',
    output: {
        filename: 'flowblocks-ui-toolbar.js', 
        path: path.resolve(__dirname, 'dist'),
        library: 'flowblocksuitoolbar',
        libraryTarget: 'umd',
        globalObject: 'this'
    },

    resolve: {
        extensions: [ '.js' ]
    },

    externals: {jointjs: "joint"}
};
