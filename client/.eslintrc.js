module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'no-unused-vars': 'warn',
    'no-console': 'warn'
  }
};