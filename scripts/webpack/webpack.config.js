const path = require("path");
const webpack = require("webpack");
const { DuplicatesPlugin } = require("inspectpack/plugin");
// const ForkTsCheckerNotifierWebpackPlugin = require("fork-ts-checker-notifier-webpack-plugin");
// const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = {
  // entry: "../../packages/solana-web/dist/esm/index.js",
  // entry: { bundle: ["../../packages/solana-web/src/index.ts", "../../packages/upload-web/src/index.ts"],},
  // entry: { bundle: ["../../packages/solana-web/dist/esm/index.js", "../../packages/upload-web/dist/esm/index.js"],},
  entry: "./index.js",

  devtool: "source-map",
  mode: "production",
  target: "web",
  module: {
    rules: [
      // {
      //   test: /\.ts$/,
      //   use: { loader: "ts-loader", options: { configFile: /* path.resolve(__dirname,"tsconfig.json") */  path.resolve(__dirname,"../../packages/solana-web/tsconfig-webpack.json")} },
      //   exclude: [/node_modules/, /* path.resolve(__dirname, "src/node/"), path.resolve(__dirname, "build/") */],
      // },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
        resolve: {
          fullySpecified: false
        }
      },
      {
        test: /\.js$/,
        include: /node_modules/,
        type: 'javascript/auto',
        resolve: {
          fullySpecified: false
        }
      }
    ],
  },

  resolve: {
    symlinks: true,
    extensions: [".ts", ".js"],
    alias: {
      process: "process/browser",
      crypto: "crypto-browserify",
      stream: "stream-browserify",
      vm: false
      // "$/utils": path.resolve(__dirname, "./src/web/utils.ts"),
    },
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      process: require.resolve("process/browser"),
      events: require.resolve("events/"),
      buffer: require.resolve("buffer/"),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
    new DuplicatesPlugin({
      emitErrors: false,
      verbose: true,
    }),
    // new ForkTsCheckerWebpackPlugin(),
    // new ForkTsCheckerNotifierWebpackPlugin({
    //   title: "TypeScript",
    //   excludeWarnings: false,
    // }),
  ],
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "build"),
    libraryTarget: "umd",
    library: "WebIrys",
  },
  stats: {
    // Display bailout reasons
    optimizationBailout: true,
  },
};
