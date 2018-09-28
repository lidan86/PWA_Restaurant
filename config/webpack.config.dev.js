const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');
const UglifyWebpackPlugin = require('uglifyjs-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const CompressionPlugin = require('compression-webpack-plugin');
// const webpack = require('webpack');

const paths = {
  root: path.resolve(__dirname, '../'),
  dist: path.resolve(__dirname, '../dist'),
  js: path.resolve(__dirname, '../js'),
  css: path.resolve(__dirname, '../css'),
  img: path.resolve(__dirname, '../img'),
};

// used in compression-webpack-plugin
const compressionOptions = {
  cache: true,
};

module.exports = {
  entry: {
    main: path.join(paths.js, 'main.js'),
    dbhelper: path.join(paths.js, 'dbhelper.js'),
    idbhandler: path.join(paths.js, 'idbhandler.js'),
    restaurant_info: path.join(paths.js, 'restaurant_info.js'),
    sw_register: path.join(paths.js, 'sw_register.js'),
    idb: path.join(paths.root, './node_modules/idb/lib/idb.js'),
    maps: path.join(paths.root, './node_modules/mapbox-gl/dist/mapbox-gl.js'),
    sw: path.join(paths.root, 'sw.js'),
  },

  // devServer: {
  //   contentBase: './dist',
  //   hot: true,
  // },

  // NOTE: https://webpack.js.org/configuration/output/#output-filename
  output: {
    path: paths.dist,
    filename: '[name].bundle.js',
  },

  // NOTE: check https://webpack.js.org/configuration/devtool/
  // and https://github.com/webpack/webpack/tree/master/examples/source-map
  // and https://lorefnon.me/2016/12/03/on-webpack-and-source-map-integration.html
  devtool: 'cheap-modules-source-map',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                [
                  'env',
                  {
                    targets: {
                      browsers: ['last 3 versions', 'ie >= 11'],
                    },
                  },
                ],
              ],
            },
          },
        ],
        exclude: [
          path.resolve(paths.root, 'node_modules'),
          path.resolve(paths.root, 'server/node_modules'),
        ],
      },
      {
        test: /\.css$/,
        use: {
          loader: 'css-loader',
          options: {
            fallback: 'style-loader',
          },
        },
      },
      {
        test: /\.(png|svg|jpe?g|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              hash: 'sha512',
              digest: 'hex',
              name: '[hash].[ext]',
              // optipng.enabled: false will disable optipng
              mozjpeg: {
                quality: 65,
              },
              optipng: {
                enabled: false,
              },
              pngquant: {
                quality: '65-90',
                speed: 4,
              },
            },
          },
          {
            loader: 'image-webpack-loader',
            options: {
              // optipng.enabled: false will disable optipng
              mozjpeg: {
                quality: 65,
              },
              optipng: {
                enabled: false,
              },
              pngquant: {
                quality: '65-90',
                speed: 4,
              },
            },
          },
        ],
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              minimize: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CompressionPlugin(compressionOptions), // https://webpack.js.org/plugins/compression-webpack-plugin/
    // new webpack.HotModuleReplacementPlugin(), //https://webpack.js.org/plugins/hot-module-replacement-plugin/
    new ImageminPlugin({
      test: '../img/**',
      mozjpeg: {
        quality: 65,
      },
      optipng: {
        enabled: false,
      },
      pngquant: {
        quality: '95-100',
      },
    }),
    new HtmlWebpackPlugin({
      hash: false,
      template: './index.html',
      title: 'Restaurant Reviews',
      chunksSortMode: 'manual',
      chunks: [
        'main',
        'dbhelper',
        'sw_register',
        'idbhandler',
        'idb',
        'maps',
        'sw',
      ],
      filename: 'index.html',
      inject: false,
      minify: true,
    }),
    new HtmlWebpackPlugin({
      hash: false,
      template: './restaurant.html',
      title: 'Restaurant Info',
      chunksSortMode: 'manual',
      chunks: [
        'restaurant_info',
        'dbhelper',
        'sw_register',
        'idb',
        'idbhandler',
        'maps',
        'sw',
      ],
      filename: 'restaurant.html',
      inject: false,
      minify: true,
      files: { css: [path.join(paths.css, 'style.css')] },
    }),
    new UglifyWebpackPlugin({
      //https://webpack.js.org/plugins/uglifyjs-webpack-plugin/
      sourceMap: true,
    }), // Make sure that the plugin is after any plugins that add images
  ],
};
