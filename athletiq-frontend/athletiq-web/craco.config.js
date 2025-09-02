const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src/'),
      '@components': path.resolve(__dirname, 'src/components/'),
      '@pages': path.resolve(__dirname, 'src/pages/'),
      '@assets': path.resolve(__dirname, 'src/assets/'),
      '@utils': path.resolve(__dirname, 'src/utils/'),
      '@services': path.resolve(__dirname, 'src/services/'),
      '@hooks': path.resolve(__dirname, 'src/hooks/'),
      '@contexts': path.resolve(__dirname, 'src/contexts/'),
      '@store': path.resolve(__dirname, 'src/store/'),
      '@config': path.resolve(__dirname, 'src/config/'),
      '@api': path.resolve(__dirname, 'src/api/'),
      '@shared': path.resolve(__dirname, 'src/shared/'),
      '@features': path.resolve(__dirname, 'src/components/features/'),
      '@layouts': path.resolve(__dirname, 'src/components/layout/'),
      '@lib': path.resolve(__dirname, 'src/lib/')
    },
    configure: (webpackConfig) => {
      // Enable source maps for better debugging
      webpackConfig.devtool = 'source-map';
      
      // Add support for absolute imports
      webpackConfig.resolve.modules = [
        path.resolve(__dirname, 'src'),
        'node_modules'
      ];

      // Exclude Node.js modules from browser bundle
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "fs": false,
        "path": false,
        "stream": false,
        "util": false,
        "buffer": false,
        "crypto": false,
        "os": false,
        "child_process": false,
        "http": false,
        "https": false,
        "url": false,
        "zlib": false,
        "querystring": false,
        "net": false,
        "tls": false,
        "dns": false,
        "readline": false,
        "perf_hooks": false,
        "worker_threads": false,
        "async_hooks": false,
        "cluster": false,
        "dgram": false,
        "module": false,
        "timers": false,
        "events": false,
        "process": false,
        "assert": false
      };

      // Ignore Node.js specific modules that shouldn't be bundled
      webpackConfig.externals = {
        ...webpackConfig.externals,
        "puppeteer": "puppeteer",
        "puppeteer-core": "puppeteer-core",
        "basic-ftp": "basic-ftp",
        "nodemailer": "nodemailer",
        "sharp": "sharp"
      };
      
      return webpackConfig;
    }
  },
  jest: {
    configure: {
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@components/(.*)$': '<rootDir>/src/components/$1',
        '^@pages/(.*)$': '<rootDir>/src/pages/$1',
        '^@assets/(.*)$': '<rootDir>/src/assets/$1',
        '^@utils/(.*)$': '<rootDir>/src/utils/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
        '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
        '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
        '^@store/(.*)$': '<rootDir>/src/store/$1',
        '^@config/(.*)$': '<rootDir>/src/config/$1',
        '^@api/(.*)$': '<rootDir>/src/api/$1',
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
        '^@features/(.*)$': '<rootDir>/src/components/features/$1',
        '^@layouts/(.*)$': '<rootDir>/src/components/layout/$1',
        '^@lib/(.*)$': '<rootDir>/src/lib/$1'
      }
    }
  },
  eslint: {
    enable: true, // Re-enabled ESLint for code quality
    mode: 'extends',
    configure: {
      settings: {
        'import/resolver': {
          alias: {
            map: [
              ['@', './src'],
              ['@components', './src/components'],
              ['@pages', './src/pages'],
              ['@assets', './src/assets'],
              ['@utils', './src/utils'],
              ['@services', './src/services'],
              ['@hooks', './src/hooks'],
              ['@contexts', './src/contexts'],
              ['@store', './src/store'],
              ['@config', './src/config'],
              ['@api', './src/api'],
              ['@shared', './src/shared'],
              ['@features', './src/components/features'],
              ['@layouts', './src/components/layout'],
              ['@lib', './src/lib']
            ],
            extensions: ['.js', '.jsx', '.ts', '.tsx']
          }
        }
      }
    }
  }
};