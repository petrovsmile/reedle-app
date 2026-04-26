const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    mode: 'development',
    devtool: 'source-map',
    
    entry: './index.web.js',

    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        clean: true,
        library: {
            type: 'var',
            name: 'app'
        }
    },

    module: {
        rules: [
            {
                test: /\.(js|jsx|mjs)$/,
                exclude: /node_modules\/(?!(react-native-.*|@react-navigation|react-navigation|react-native-swipe-list-view|react-native-gesture-handler|react-native-reanimated|react-native-safe-area-context|react-native-circular-progress|react-native-svg)\/).*/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                modules: false,
                                targets: {
                                    browsers: ['last 2 versions', 'not dead', 'not ie 11']
                                }
                            }],
                            ['@babel/preset-react', { runtime: 'automatic' }]
                        ],
                        plugins: [
                            '@babel/plugin-proposal-class-properties',
                            '@babel/plugin-proposal-private-methods',
                            '@babel/plugin-transform-runtime'
                        ],
                        sourceType: 'unambiguous'
                    },
                },
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                type: 'asset/resource',
            },
        ],
    },

    resolve: {
        alias: {
            'react-native$': 'react-native-web',
            'react-native-fs': path.resolve(__dirname, 'web-stubs/react-native-fs.js'),
            'react-native-nitro-modules': path.resolve(__dirname, 'web-stubs/react-native-nitro-modules.js'),
            'react-native-sound': path.resolve(__dirname, 'web-stubs/react-native-sound.js'),
            'react-native-tts': path.resolve(__dirname, 'web-stubs/react-native-tts.js'),
            'react-native-store-review': path.resolve(__dirname, 'web-stubs/react-native-store-review.js'),
            'react-native-tracking-transparency': path.resolve(__dirname, 'web-stubs/react-native-tracking-transparency.js'),
            'react-native-iap': path.resolve(__dirname, 'web-stubs/react-native-iap.js'),
            'YandexMobileAdsSample': path.resolve(__dirname, 'web-stubs/yandex-ads.js'),
            '@react-native-async-storage/async-storage': path.resolve(__dirname, 'web-stubs/async-storage.js'),
        },
        extensions: ['.web.js', '.web.jsx', '.js', '.jsx', '.mjs', '.json'],
        mainFields: ['browser', 'module', 'main'],
        symlinks: false,
        fallback: {
            "path": false,
            "fs": false,
            "crypto": false,
            "stream": false,
            "buffer": false,
            "util": false,
            "url": false,
            "zlib": false,
            "http": false,
            "https": false,
            "assert": false,
            "os": false,
        },
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html',
            inject: 'body',
            scriptLoading: 'defer',
        }),
        new webpack.DefinePlugin({
            '__DEV__': JSON.stringify(true),
            'process.env.NODE_ENV': JSON.stringify('development'),
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],

    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        compress: true,
        port: 3000,
        hot: true,
        open: true,
        historyApiFallback: true,
        client: {
            overlay: {
                errors: true,
                warnings: false,
            },
        },
        // 🟢 ИСПРАВЛЕННЫЙ ПРОКСИ - ТЕПЕРЬ ЭТО МАССИВ
        proxy: [
            {
                context: ['/api'],  // ← context вместо ключа объекта
                target: 'https://reedle.ru',
                changeOrigin: true,
                secure: false,
                logLevel: 'debug',
                onProxyReq: (proxyReq, req, res) => {
                    proxyReq.removeHeader('origin');
                },
                onError: (err, req, res) => {
                    console.error('Proxy error:', err);
                    res.writeHead(500, {
                        'Content-Type': 'text/plain',
                    });
                    res.end('Proxy error: ' + err.message);
                }
            }
        ]
    },

    target: 'web',
    experiments: {
        topLevelAwait: false,
    },
};