const CopyPlugin = require('copy-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const CDN_ADDRESS = process.env.VUE_APP_CDN
const ENTRY_PAGE = process.env.ENTRY_PAGE || 'main'
const isProduction = process.env.NODE_ENV === 'production'
const IS_MOBILE = ENTRY_PAGE !== 'main'

const projectName = 'dex3' // increase the number if we want to force upgrade

module.exports = {
  publicPath: CDN_ADDRESS,

  productionSourceMap: false,

  pwa: {
    workboxOptions: {
      exclude: [
        /\.html$/, // I don't know why I need to change this matching pattern from string to RegEx to get it work.
      ],
    },
  },

  pages: {
    index: {
      entry: `src/${ENTRY_PAGE}.ts`,
      chunks: ['vue', 'mcdex', 'chunk-vendors', 'chunk-common', 'index'].concat(IS_MOBILE ? ['vant'] : ['element']),
    },
  },

  css: {
    sourceMap: true,
  },

  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.md$/,
          use: [
            { loader: 'html-loader' },
            {
              loader: 'markdown-loader',
              options: {
                /* your options here */
              },
            },
          ],
        },
        {
          test: /\.less$/,
          use: [
            // other loaders
            {
              loader: 'less-loader',
              options: {
                // if less-loader < 6.0, please remove "lessOptions" layer. set variables directly
                lessOptions: {
                  modifyVars: {
                    // overwrite by key
                    // 'text-color': '#111',
                    // 'border-color': '#eee',
                    // overwrite by less
                    hack: `true; @import "./src/vant.less";`,
                  },
                },
              },
            },
          ],
        },
      ],
    },
    optimization: {
      splitChunks: {
        cacheGroups: Object.assign(
          {
            vue: {
              name: 'vue',
              test: /[\\/]node_modules[\\/]vue(?!-slider-component)/,
              priority: 90,
              chunks: 'all',
            },
            mcdex: {
              name: 'mcdex',
              test: /[\\/]node_modules[\\/]((@mcdex+)|(@mcarloai+))/,
              priority: 200,
              chunks: 'all',
            },
            vendors: {
              name: `chunk-vendors`,
              test: /[\\/]node_modules[\\/]/,
              priority: 50,
              chunks: 'initial',
              enforce: true, // do not delete, fixed issue of mini-css-extra-plugin
              // maxSize: isProduction ? 1000000 : 0, // conflict with enforce property, so delete it
            },
            common: {
              name: `chunk-common`,
              minChunks: 2,
              priority: 20,
              chunks: 'initial',
              reuseExistingChunk: true,
            },
          },
          IS_MOBILE
            ? {
              vant: {
                name: 'vant',
                test: /[\\/]node_modules[\\/]vant.*/,
                priority: 100,
                chunks: 'all',
              },
            }
            : {
              element: {
                name: 'element',
                test: /[\\/]node_modules[\\/]element.*/,
                priority: 100,
                chunks: 'all',
              },
            }),
      },
    },
    plugins: [
      new CopyPlugin([
        { from: 'vendor/charting_library/charting_library', to: 'vendor/charting_library/charting_library' },
        { from: 'src/assets/img', to: 'assets/img' },
      ]),
      // new BundleAnalyzerPlugin({
      //   analyzerMode: 'static'
      // }),
    ],
  },

  chainWebpack: config => {
    if (isProduction) {
      config
        .output
        .filename(`js/${projectName}~[name].[contenthash:8].js`)
        .chunkFilename(`js/${projectName}~[name].[contenthash:8].js`)

      config
        .plugin('extract-css')
        .use(require('mini-css-extract-plugin'), [{
          filename: `css/${projectName}~[name].[contenthash:8].css`,
          chunkFilename: `css/${projectName}~[name].[contenthash:8].css`,
        }])
    }

    config.plugin('prefetch-index').tap(options => {
      options[0].fileBlacklist = options[0].fileBlacklist || []
      options[0].fileBlacklist.push(/noprefetch-.*/)
      return options
    })
  },
}
