// eslint-disable-next-line import/no-extraneous-dependencies
import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '../monoid-api/schema/*.graphqls',
  documents: ['src/**/*.tsx', 'src/**/*.ts'],
  generates: {
    './src/__generated__/': {
      preset: 'client',
      plugins: [{
        add: {
          content: '/* eslint-disable */',
        },
      }],
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: false,
      },
      config: {
        dedupeFragments: true,
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
