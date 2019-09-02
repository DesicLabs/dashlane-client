const path = require("path");
const webpack = require("webpack");
const DtsBundleWebpack = require("dts-bundle-webpack");
const nodeExternals = require("webpack-node-externals");

const config = {
  entry: "./src/Client.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new DtsBundleWebpack({
      name: "dashlane",
      main: "dist/Client.d.ts",
      removeSource: true,
      outputAsModuleFolder: true
    })
  ],
  mode: "production",
  //devtool: "inline-source-map",
  devServer: {
    contentBase: "./dist"
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "umd",
    globalObject: "typeof self !== 'undefined' ? self : this"
  }
};

const webConfig = {
  ...config,
  target: "web",
  node: {
    process: "mock",
    fs: "empty",
    zlib: true,
    buffer: true,
    crypto: true
  },
  module: {
    noParse: /\.wasm$/,
    rules: [
      ...config.module.rules,
      {
        test: /\.wasm$/,
        loaders: ["base64-loader"],
        type: "javascript/auto"
      }
    ]
  },
  resolve: {
    extensions: [".browser.ts", ".ts", ".js"]
  },
  output: {
    ...config.output,
    filename: "dashlane.browser.js"
  }
};

const serverConfig = {
  ...config,
  resolve: {
    extensions: [".node.ts", ".ts", ".js"]
  },
  plugins: [
    new webpack.ProvidePlugin({
      FormData: "form-data",
      fetch: ["node-fetch", "default"]
    })
  ],
  externals: [nodeExternals()],
  target: "node",
  output: { ...config.output, filename: "dashlane.node.js" }
};

module.exports = [serverConfig, webConfig];
