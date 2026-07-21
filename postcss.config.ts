import type { Config } from 'postcss-load-config';

const config: Config = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: [
          'advanced',
          {
            discardComments: { removeAll: true },
            reduceIdents: false,
            zindex: false,
          },
        ],
      },
    }),
  },
};

export default config;