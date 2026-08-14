export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'client-angular',
        'server-firebase',
        'core',
        'plugins',
        'shared',
        'deps',
        'ci',
        'release',
        'docs',
        'workspace',
        'tools',
      ],
    ],
    'scope-empty': [1, 'never'],
  },
};
