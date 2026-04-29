module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin', // единственный нужный плагин
  ],
  env: {
    web: {
      presets: [
        ['@babel/preset-env', { modules: false, targets: { browsers: ['last 2 versions'] } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    },
  },
};