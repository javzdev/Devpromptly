const js = require('@eslint/js');

module.exports = [
  // Ignorar carpetas que no necesitan lint
  {
    ignores: [
      'node_modules/**',
      'client/node_modules/**',
      'client/build/**',
      'server/scripts/**',
      'server/seedForums.js',
      'server/seedTools.js',
      'generate-secrets.js'
    ]
  },

  // Reglas para el servidor (Node.js CommonJS)
  {
    files: ['server/**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      // Errores reales
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-unreachable': 'error',

      // Seguridad
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Debug — bloquear console.log en producción (console.error permitido)
      'no-console': ['warn', { allow: ['error', 'warn', 'info'] }],

      // Estilo básico (sin formateo agresivo)
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',

      // No obligatorios pero sí útiles
      'no-duplicate-imports': 'error',
      'no-shadow': 'warn'
    }
  }
];
