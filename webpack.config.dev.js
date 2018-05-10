var ExtractTextPlugin = require('extract-text-webpack-plugin');
module.exports = {
  entry: "./src/main.ts",
  output: {
      filename: "bundle.js",
      path: __dirname + "/dist"
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",

  devServer: {
    clientLogLevel: 'warning',
    hot: true,
    publicPath: '/'
  },

  resolve: {
      // Add '.ts' and '.tsx' as resolvable extensions.
      extensions: [".ts", ".tsx", ".js", ".json"]
  },

  module: {
      rules: [
        {test: /\.css$/, loader: ExtractTextPlugin.extract("style-loader","css-loader")},
        {
          test: /\.less$/,
          use:ExtractTextPlugin.extract({
            fallback:'style-loader',
            use:['css-loader','less-loader']
          })
        },
        {test: /\.(eot|woff|woff2|ttf|svg)([\\?]?.*)$/, loader: "file-loader"},
        // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
        { test: /\.tsx?$/, loader: "awesome-typescript-loader" },

        // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
        { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
      ]
  },
  plugins: [
    new ExtractTextPlugin("spreadsheet.css")
  ]

  // When importing a module whose path matches one of the following, just
  // assume a corresponding global variable exists and use that instead.
  // This is important because it allows us to avoid bundling all of our
  // dependencies, which allows browsers to cache those libraries between builds.
  // externals: {
  //     "react": "React",
  //     "react-dom": "ReactDOM"
  // },
};