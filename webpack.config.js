const path = require("path");
const webpack = require("webpack");

const config = {
  entry: "./src/dashlane.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  mode: "production",
  devServer: {
    contentBase: "./dist"
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
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
    buffer: true,
    crypto: true,
    zlib: true
  },
  output: { ...config.output, filename: "dashlane.client.js" }
};

const serverConfig = {
  ...config,
  target: "node",
  output: { ...config.output, filename: "dashlane.node.js" },
  plugins: [
    new webpack.ProvidePlugin({
      fetch: ["node-fetch", "default"],
      FormData: "form-data"
    })
  ]
};

module.exports = [serverConfig, webConfig];
