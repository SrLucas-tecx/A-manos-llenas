// eslint.config.js — reglas de estilo y errores comunes del backend (npm run lint)
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  // Carpetas que no se revisan
  { ignores: ['node_modules/', 'coverage/'] },

  // Reglas recomendadas de ESLint
  js.configs.recommended,

  // Todo el backend: Node.js con CommonJS (require / module.exports)
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      // Variables sin usar: error, excepto las que empiezan con "_" (p. ej. _req, _next)
      // ignoreRestSiblings permite quitar campos al copiar: const { password, ...resto } = usuario
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true },
      ],
      'no-useless-escape': 'warn', // aviso (no bloquea el pipeline): p. ej. "\." dentro de [ ] en un regex
      'no-console': 'off', // el servidor usa console.log / console.error a propósito
      eqeqeq: ['error', 'always'], // siempre === y !==
      'prefer-const': 'error',
    },
  },

  // Pruebas: además tienen las variables globales de Jest (describe, test, expect...)
  {
    files: ['test/**/*.js'],
    languageOptions: { globals: globals.jest },
  },
];
