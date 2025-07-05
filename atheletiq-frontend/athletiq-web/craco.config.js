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
    enable: true,
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