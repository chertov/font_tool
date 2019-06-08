
const path = require('path');
const WebpackNotifierPlugin = require('webpack-notifier');
// const CircularDependencyPlugin = require('circular-dependency-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
// const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const font_tool = {
    name: 'Browser',
    entry: './src/main.ts',
    target: 'node',
    output: {
        path: path.resolve(__dirname, './release/'),
        filename: 'main.js'
    },

    stats: { children: false }, // prevent spam-logs in console
    watch: true,
    cache: true,
    mode: 'development',
    devtool: 'source-map',
    resolve: {
        modules: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'node_modules')],
        extensions: ['*', '.js', '.json', '.ts', '.tsx']
    },
    module: {
        rules: [
            { test: /\.(ts)?$/, exclude: /node_modules/, include: [path.resolve(__dirname, 'src')], loader: 'ts-loader' },
            { test: /\.(js)$/, exclude: /node_modules/, include: [path.resolve(__dirname, 'src')], loader: 'babel-loader' },
        ]
    },
    plugins: [
        new WebpackNotifierPlugin({ excludeWarnings: true, alwaysNotify: true }),
        new ProgressBarPlugin(),
    ]
};


const web = {
    name: 'Browser',
    entry: './src/web.tsx',
    // target: 'node',
    output: {
        path: path.resolve(__dirname, './docs/'),
        filename: 'bundle.js'
    },

    stats: { children: false }, // prevent spam-logs in console
    watch: true,
    cache: true,
    mode: 'development',
    // devtool: 'source-map',
    resolve: {
        modules: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'node_modules')],
        extensions: ['*', '.js', '.json', '.ts', '.tsx']
    },
    module: {
        rules: [
            // { test: /\.(ts)?$/, exclude: /node_modules/, include: [path.resolve(__dirname, 'src', 'node_modules')], loader: 'ts-loader' },
            { test: /\.(ts|tsx)$/, loader: "awesome-typescript-loader" },
            { test: /\.(js)$/, exclude: /node_modules/, include: [path.resolve(__dirname, 'src')], loader: 'babel-loader' },
            { test: /\.json$/, loader: 'json-loader' },
            { test: /\.css$/,
                loader: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: {
                        loader: 'css-loader',
                        options: { modules: true, localIdentName: '[name]__[local]--[hash:base64:5]' }
                    }
                })
            }
        ]
    },
    plugins: [
        new WebpackNotifierPlugin({ excludeWarnings: true, alwaysNotify: true }),
        new ProgressBarPlugin(),
    ]
};


module.exports = [web, font_tool];
