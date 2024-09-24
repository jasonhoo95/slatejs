module.exports = {
  extends: [
    'prettier',
    'plugin:@typescript-eslint/recommended', // Combine both into one array
  ],
  parser: '@typescript-eslint/parser', // Specify TypeScript parser
  plugins: ['@typescript-eslint'], // Add TypeScript plugin
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    requireConfigFile: false, // If you're not using a Babel config file
  },
  compilerOptions: {
    target: 'ES2021', // Or later if needed
    // other configurations
  },

  rules: {
    'key-spacing': [
      'error',
      {
        beforeColon: true,
        afterColon: true,
      },
    ],
  },
};
