// Note on SASS (SCSS to CSS conversion): 
// Based on what I see online most people have massive troubles getting SASS to work with WebPack for a variety of 
// different reasons. I did too, and finally also realized a better solution for what I wanted (simple conversion of SCSS to CSS files)
// was to put that logic in 'on-build-start.sh'.

let webpack = require('webpack');
let CircularDependencyPlugin = require('circular-dependency-plugin');
let WebpackShellPlugin = require('webpack-shell-plugin');
let HtmlWebpackPlugin = require('html-webpack-plugin');
// let MiniCssExtractPlugin = require("mini-css-extract-plugin");

let prod = process.argv.indexOf('-p') !== -1;
let env = prod ? "prod" : "dev";

console.log("TARGET ENV: " + env);

module.exports = {
    entry: "./ts/index.ts",
    output: {
        filename: "bundle.js",
        path: __dirname
    },

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".js", ".json"] 
    },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            {
                test: /\.ts$/,
                loader: "awesome-typescript-loader",
                query: {
                    // Use this to point to your tsconfig.json.
                    configFileName: './tsconfig.' + env + '.json'
                }
            },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            },

            {
                test: /\.htm$/,
                use: ['html-loader']
            },

            // {
            //     test: /\.scss$/,
            //     use: [
            //         "style-loader", //MiniCssExtractPlugin.loader, 
            //         "css-loader", // translates CSS into CommonJS
            //         "sass-loader" // compiles Sass to CSS, using Node Sass by default
            //     ]
            // }
        ]
    },

    plugins: [
        new webpack.DefinePlugin({
            //this was a test: Didn't work. I tried it in the index.html and it was not translated.
            //Ended up accomplishing this using my 'cachebuster' option on HtmlWebpackPlugin instead.
            __VERSION__: JSON.stringify("180107")
        }),
        new WebpackShellPlugin({
            onBuildStart: ["./on-build-start.sh"],
            //onBuildEnd: ['whatever else']
        }),
        new CircularDependencyPlugin({
            // `onDetected` is called for each module that is cyclical
            onDetected({ module: webpackModuleRecord, paths, compilation }) {
                // `paths` will be an Array of the relative module paths that make up the cycle
                // `module` will be the module record generated by webpack that caused the cycle
                var fullPath = paths.join(" -> ");
                if (fullPath.indexOf("node_modules")==-1) {
                    compilation.errors.push(new Error("CIRC. REF: "+fullPath));
                }
            }
        }),
        new HtmlWebpackPlugin({
            template: './html/index.html',
            filename: 'index.html',
            hash: true,
            cachebuster: '' + new Date().getTime()
        }),
        // new MiniCssExtractPlugin({
        //     filename: '[name].css'
        // })
    ]
};