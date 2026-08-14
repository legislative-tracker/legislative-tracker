## 0.11.1 (2026-08-14)

### 🚀 Features

- **release:** use create-pull-request for release PRs on protected main branch ([72b7e56](https://github.com/legislative-tracker/legislative-tracker/commit/72b7e56))
- **tools:** add dependabot config and knip for dead code analysis ([ed2a776](https://github.com/legislative-tracker/legislative-tracker/commit/ed2a776))
- **ci:** add pr title semantic validation and ci formatting check ([281344a](https://github.com/legislative-tracker/legislative-tracker/commit/281344a))
- **ci:** configure commitlint, lint-staged, and husky hooks ([3be8d5a](https://github.com/legislative-tracker/legislative-tracker/commit/3be8d5a))
- **ci:** automate semver releases on main and sync footer appVersion ([b493586](https://github.com/legislative-tracker/legislative-tracker/commit/b493586))

### 🩹 Fixes

- **release:** move git options under release.version.git and release.changelog.git in nx.json ([b62a066](https://github.com/legislative-tracker/legislative-tracker/commit/b62a066))
- **release:** disable automatic nx release git tag creation to prevent duplicate tag errors ([194652f](https://github.com/legislative-tracker/legislative-tracker/commit/194652f))
- **release:** configure fallbackCurrentVersionResolver to disk in nx.json ([543dbc1](https://github.com/legislative-tracker/legislative-tracker/commit/543dbc1))
- **release:** push release commits from detached HEAD to main branch and force tag update ([6316302](https://github.com/legislative-tracker/legislative-tracker/commit/6316302))
- **release:** explicitly set currentVersionResolver to git-tag in nx.json ([ad332cf](https://github.com/legislative-tracker/legislative-tracker/commit/ad332cf))
- **release:** add git fetch tags step in release workflow ([d326a24](https://github.com/legislative-tracker/legislative-tracker/commit/d326a24))
- **release:** clean up nx.json schema warnings for defaultBase and version ([23ff7fe](https://github.com/legislative-tracker/legislative-tracker/commit/23ff7fe))
- **release:** limit app group target to root project ([3b97999](https://github.com/legislative-tracker/legislative-tracker/commit/3b97999))
- **release:** point app group to root project @legislative-tracker/source ([a1bc434](https://github.com/legislative-tracker/legislative-tracker/commit/a1bc434))
- **release:** configure fallbackCurrentVersionResolver to disk in nx.json ([bf09b90](https://github.com/legislative-tracker/legislative-tracker/commit/bf09b90))
- **release:** specify client-angular project and conventionalCommits mapping in nx.json ([a4dda58](https://github.com/legislative-tracker/legislative-tracker/commit/a4dda58))
- **deps:** align angular, vitest, and graphql versions to resolve peer dependency conflicts ([871d3ac](https://github.com/legislative-tracker/legislative-tracker/commit/871d3ac))
- **release:** place changelog in docs folder, bypass husky in CI, and prevent duplicate tag errors ([b1b2b0d](https://github.com/legislative-tracker/legislative-tracker/commit/b1b2b0d))
- **ci:** configure automaticFromRef and fetch-tags for nx release ([da19895](https://github.com/legislative-tracker/legislative-tracker/commit/da19895))
- **ci:** remove invalid --yes flags and update nx release config in release workflow ([96d9853](https://github.com/legislative-tracker/legislative-tracker/commit/96d9853))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud
