module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:react/recommended',
    'airbnb',
    'airbnb-typescript'
  ],
  ignorePatterns: [
    '.eslintrc.js', 'react-app-env.d.ts', 'build/*',
    'postcss.config.js', 'tailwind.config.js',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: [
    'react',
    '@typescript-eslint'
  ],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    }
  },
  rules: {
    'jsx-a11y/label-has-associated-control': 'off',
    'react/jsx-props-no-spreading': [
      2, {
        html: 'ignore',
        custom: 'enforce',
        explicitSpread: 'ignore',
        exceptions: []
      }
    ]
  }
}
