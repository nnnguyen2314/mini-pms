module.exports = function (api) {
  const isCoverage = api.env('coverage');
  // Cache based on NODE_ENV/BABEL_ENV so switching modes recalculates
  api.cache(true);

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: { node: 'current' },
        },
      ],
      [
        '@babel/preset-react',
        {
          runtime: 'automatic',
          development: process.env.NODE_ENV === 'development',
        },
      ],
      ['@babel/preset-typescript'],
    ],
    plugins: [
      // Needed by NYC when instrumenting sources during Cypress coverage
      ['@babel/plugin-transform-modules-commonjs'],
      isCoverage && 'istanbul',
    ].filter(Boolean),
    overrides: [
      {
        test: ['./src/test/**'],
        // These helpers are test-only; still allow JSX parsing
        presets: [
          [
            '@babel/preset-react',
            { runtime: 'automatic' },
          ],
          ['@babel/preset-typescript'],
        ],
      },
    ],
  };
};
