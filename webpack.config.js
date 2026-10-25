const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:3000';
const webOutputPath = process.env.WEB_OUTPUT_PATH
    ? path.resolve(__dirname, process.env.WEB_OUTPUT_PATH)
    : path.resolve(__dirname, 'dist/web');

class EmitPwaAssetsPlugin {
    apply(compiler) {
        compiler.hooks.thisCompilation.tap('EmitPwaAssetsPlugin', (compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'EmitPwaAssetsPlugin',
                    stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
                },
                () => {
                    const { RawSource } = compiler.webpack.sources;
                    const assets = {
                        'manifest.webmanifest': './public/manifest.webmanifest',
                        'sw.js': './public/sw.js',
                        'icons/icon-192.png': './public/icons/icon-192.png',
                        'icons/icon-512.png': './public/icons/icon-512.png',
                        'icons/icon-maskable.png': './public/icons/icon-maskable.png',
                        'icons/apple-touch-icon.png': './public/icons/apple-touch-icon.png',
                    };

                    Object.entries(assets).forEach(([outputPath, sourcePath]) => {
                        const source_file = path.resolve(__dirname, sourcePath);
                        compilation.fileDependencies.add(source_file);
                        let source = compiler.inputFileSystem.readFileSync(source_file);
                        if (outputPath === 'sw.js') {
                            const entryAssets = Array.from(compilation.entrypoints.values())
                                .flatMap((entrypoint) => entrypoint.getFiles())
                                .filter((fileName) => /\.(js|css)$/.test(fileName))
                                .map((fileName) => `'${compilation.outputOptions.publicPath}${fileName}'`)
                                .join(',\n  ');
                            source = source
                                .toString()
                                .replace('__BUILD_HASH__', crypto.createHash('sha256')
                                    .update(compilation.fullHash)
                                    .update(compilation.getAsset('index.html').source.source())
                                    .update(source)
                                    .digest('hex').slice(0, 12))
                                .replaceAll('__PUBLIC_PATH__', compilation.outputOptions.publicPath)
                                .replace('__PWA_CACHE_ENABLED__', String(isProduction))
                                .replace('__APP_SHELL_ASSETS__', entryAssets);
                        }
                        compilation.emitAsset(
                            outputPath,
                            new RawSource(source)
                        );
                    });

                    const fontsDirectory = path.resolve(__dirname, 'public/fonts');
                    fs.readdirSync(fontsDirectory).forEach((fileName) => {
                        compilation.emitAsset(
                            `fonts/${fileName}`,
                            new RawSource(compiler.inputFileSystem.readFileSync(path.join(fontsDirectory, fileName)))
                        );
                    });
                }
            );
        });
    }
}

module.exports = {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'source-map',

    entry: './index.web.js',

    output: {
        path: isProduction ? webOutputPath : path.resolve(__dirname, 'web'),
        publicPath: isProduction ? '/app/' : '/',
        filename: isProduction ? 'bundle.[contenthash:8].js' : 'bundle.js',
        chunkFilename: isProduction ? '[name].[contenthash:8].js' : '[name].js',
        clean: true,
    },

    module: {
        rules: [
            {
                // Native keeps HOST from app/configs.js. For web, requests must stay
                // relative so webpack-dev-server can forward them through its proxy.
                test: /App\.js$/,
                enforce: 'pre',
                use: path.resolve(__dirname, 'scripts/web-host-loader.js'),
            },
            {
                test: /\.(js|jsx|mjs|ts|tsx)$/,
                exclude: /node_modules\/(?!(react-native-.*|@react-navigation|react-navigation|react-native-swipe-list-view|react-native-gesture-handler|react-native-reanimated|react-native-safe-area-context|react-native-circular-progress|react-native-svg)\/).*/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        // Ignore babel.config.js — it's for React Native (includes @react-native/babel-preset
                        // which converts ES modules to CJS, breaking webpack's module handling)
                        configFile: false,
                        babelrc: false,
                        presets: [
                            ['@babel/preset-env', {
                                modules: false,
                                targets: {
                                    browsers: ['last 2 versions', 'not dead', 'not ie 11']
                                }
                            }],
                            ['@babel/preset-react', { runtime: 'automatic' }],
                            ['@babel/preset-typescript', { allExtensions: true, isTSX: true }],
                        ],
                        plugins: [
                            ['@babel/plugin-proposal-class-properties', { loose: true }],
                            ['@babel/plugin-proposal-private-methods', { loose: true }],
                            ['@babel/plugin-transform-private-property-in-object', { loose: true }],
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
            // Disable fullySpecified for node_modules ESM packages that use bare imports
            {
                test: /\.m?js$/,
                include: /node_modules/,
                resolve: {
                    fullySpecified: false,
                },
            },
        ],
    },

    resolve: {
        alias: {
            // react-native → react-native-web
            'react-native$': 'react-native-web',
            '@react-native/assets-registry/registry$': path.resolve(
                __dirname,
                'node_modules/react-native-web/dist/modules/AssetRegistry/index.js'
            ),

            // Заглушки нативных модулей без веб-поддержки
            'react-native-fs': path.resolve(__dirname, 'web-stubs/react-native-fs.js'),
            'react-native-nitro-modules': path.resolve(__dirname, 'web-stubs/react-native-nitro-modules.js'),
            'react-native-sound': path.resolve(__dirname, 'web-stubs/react-native-sound.js'),
            'react-native-store-review': path.resolve(__dirname, 'web-stubs/react-native-store-review.js'),
            'react-native-tracking-transparency': path.resolve(__dirname, 'web-stubs/react-native-tracking-transparency.js'),
            'react-native-iap': path.resolve(__dirname, 'web-stubs/react-native-iap.js'),
            'react-native-purchases': path.resolve(__dirname, 'web-stubs/react-native-purchases.js'),
            'react-native-restart': path.resolve(__dirname, 'web-stubs/react-native-restart.js'),
            'react-native-webview': path.resolve(__dirname, 'web-stubs/react-native-webview.js'),
            'react-native-worklets$': path.resolve(__dirname, 'web-stubs/react-native-nitro-modules.js'),
            '@appmetrica/react-native-analytics': path.resolve(__dirname, 'web-stubs/appmetrica.js'),
            '@react-native-async-storage/async-storage': path.resolve(__dirname, 'web-stubs/async-storage.js'),
            '@react-native-community/netinfo': path.resolve(__dirname, 'web-stubs/netinfo.js'),
            '@react-native-community/slider': path.resolve(__dirname, 'web-stubs/slider.js'),
            '@react-native-firebase/messaging': path.resolve(__dirname, 'web-stubs/firebase-messaging.js'),
            '@react-native-firebase/app': path.resolve(__dirname, 'web-stubs/firebase-messaging.js'),
            'yandex-mobile-ads': path.resolve(__dirname, 'web-stubs/yandex-ads.js'),
            'YandexMobileAdsSample': path.resolve(__dirname, 'web-stubs/yandex-ads.js'),
        },
        extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.json'],
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
            favicon: './ios/reedle/Images.xcassets/AppIcon.appiconset/Icon-180.png',
            inject: 'body',
            scriptLoading: 'defer',
            ...(isProduction ? { base: '/app/' } : {}),
        }),
        new EmitPwaAssetsPlugin(),
        new webpack.DefinePlugin({
            '__DEV__': JSON.stringify(!isProduction),
            'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
            // Пустая строка → запросы идут на /api/... → перехватываются прокси dev-сервера
            'HOST': JSON.stringify(''),
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],

    devServer: {
        host: '127.0.0.1',
        static: {
            directory: path.join(__dirname, 'public'),
        },
        compress: true,
        port: 3001,
        hot: true,
        open: true,
        historyApiFallback: true,
        client: {
            overlay: {
                errors: true,
                warnings: false,
            },
        },
        proxy: [
            {
                context: ['/api', '/books', '/oauth_redirect', '/voiceover', '/voiceover_books'],
                target: apiProxyTarget,
                changeOrigin: true,
                secure: false,
                onProxyReq: (proxyReq) => {
                    proxyReq.removeHeader('origin');
                },
                onError: (err, req, res) => {
                    console.error('Proxy error:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Proxy error: ' + err.message);
                }
            }
        ]
    },

    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    mangle: {
                        // Don't rename these - some pre-compiled CJS packages in node_modules
                        // reference them as free variables after babel+webpack transform
                        reserved: ['exports', 'require', 'module'],
                    },
                    compress: {
                        passes: 2,
                    },
                },
            }),
        ],
    },

    performance: {
        maxAssetSize: 2 * 1024 * 1024,
        maxEntrypointSize: 2 * 1024 * 1024,
    },

    target: 'web',
    experiments: {
        topLevelAwait: false,
    },
};
