import path from 'path';
import { fileURLToPath } from 'url';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('webpack').Configuration} */
export default {
  target: 'node',
  entry: {
    extension: './src/extension.ts',
    server: './src/server.ts', // 👈 your MCP server entry
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        // Copy package.json for runtime use
        { from: 'package.json', to: 'package.json' },
        // If you have static assets in `server/`, still include them
        { from: 'server', to: 'server', noErrorOnMissing: true },
      ],
    }),
  ],
  externals: {
    vscode: 'commonjs vscode',
  },
  devtool: 'source-map',
};
