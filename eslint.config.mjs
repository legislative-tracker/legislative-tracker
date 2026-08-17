import nx from '@nx/eslint-plugin';
import typescriptEslintParser from '@typescript-eslint/parser';

export default [
  ...nx.configs['flat/base'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: false,
          allow: [],
          depConstraints: [
            {
              sourceTag: 'domain:shared',
              onlyDependOnLibsWithTags: ['domain:shared'],
            },
            {
              sourceTag: 'domain:client',
              onlyDependOnLibsWithTags: [
                'domain:shared',
                'domain:client',
                'domain:plugins',
              ],
            },
            {
              sourceTag: 'domain:server',
              onlyDependOnLibsWithTags: [
                'domain:shared',
                'domain:server',
                'domain:plugins',
              ],
            },
            {
              sourceTag: 'domain:plugins',
              onlyDependOnLibsWithTags: ['domain:shared', 'domain:plugins'],
            },
            {
              sourceTag: 'type:model',
              onlyDependOnLibsWithTags: ['type:model'],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: [
                'type:model',
                'type:util',
                'type:core',
                'type:plugin',
                'type:data-access',
              ],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: [
                'type:model',
                'type:util',
                'type:core',
                'type:ui',
              ],
            },
            {
              sourceTag: 'type:core',
              onlyDependOnLibsWithTags: [
                'type:model',
                'type:util',
                'type:core',
              ],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:model',
                'type:util',
                'type:ui',
                'type:core',
                'type:feature',
              ],
            },
          ],
        },
      ],
    },
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
  },
  {
    ignores: [
      'dist',
      '.nx',
      'tmp',
      'coverage',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
];
