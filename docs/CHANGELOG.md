## 0.11.22 (2026-08-24)

### 🚀 Features

- **client-angular:** add reset districts and delete account data to profile ([88db6bc](https://github.com/legislative-tracker/legislative-tracker/commit/88db6bc))
- **client-angular:** create ConfirmDialog component in ui library ([ac537f2](https://github.com/legislative-tracker/legislative-tracker/commit/ac537f2))
- **core:** add clearAll storage and auth resetDistricts and deleteAccountData methods ([4ae4a9e](https://github.com/legislative-tracker/legislative-tracker/commit/4ae4a9e))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.21 (2026-08-24)

### 🩹 Fixes

- **client-angular:** use routerLink instead of href in admin expansion panels ([998651c](https://github.com/legislative-tracker/legislative-tracker/commit/998651c))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.20 (2026-08-24)

### 🚀 Features

- **client-angular:** update bill route to use ocd-bill path parameter ([4cdce5e](https://github.com/legislative-tracker/legislative-tracker/commit/4cdce5e))
- **client-angular:** add baseline OpenGraph and Twitter meta tags to index.html ([473bc45](https://github.com/legislative-tracker/legislative-tracker/commit/473bc45))
- **client-angular:** add dynamic social metadata for bill and member routes ([943fc67](https://github.com/legislative-tracker/legislative-tracker/commit/943fc67))
- **client-angular:** add theme toggle button and menu to navigation header ([1d6846b](https://github.com/legislative-tracker/legislative-tracker/commit/1d6846b))
- **core:** add SeoService and ThemeService with tests ([fd8db33](https://github.com/legislative-tracker/legislative-tracker/commit/fd8db33))

### 🩹 Fixes

- **core:** resolve theme toggle race condition and prevent light mode override ([7387f38](https://github.com/legislative-tracker/legislative-tracker/commit/7387f38))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.19 (2026-08-24)

### 🚀 Features

- **workspace:** protect manual update triggers and add admin sync UI ([908de8a](https://github.com/legislative-tracker/legislative-tracker/commit/908de8a))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.18 (2026-08-23)

### 🚀 Features

- **workspace:** add github issues feedback backend and client integration ([a06d414](https://github.com/legislative-tracker/legislative-tracker/commit/a06d414))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.17 (2026-08-22)

### 🩹 Fixes

- **server-firebase:** add project id to emulator export target ([61a6425](https://github.com/legislative-tracker/legislative-tracker/commit/61a6425))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.16 (2026-08-22)

### 🩹 Fixes

- **release:** use rebuild-changelog script for automated release changelogs ([b173332](https://github.com/legislative-tracker/legislative-tracker/commit/b173332))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.15 (2026-08-22)

### 🩹 Fixes

- **server-firebase:** add openstates secret to legislation triggers ([b9cfa15](https://github.com/legislative-tracker/legislative-tracker/commit/b9cfa15))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.14 (2026-08-22)

### 🩹 Fixes

- **client-angular:** use ocd-person routeType for dashboard member tables ([de13365](https://github.com/legislative-tracker/legislative-tracker/commit/de13365))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.13 (2026-08-22)

### 🚀 Features

- **release:** add changelog rebuild script and update release changelog config ([c301985](https://github.com/legislative-tracker/legislative-tracker/commit/c301985))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.12 (2026-08-22)

### 🚀 Features

- **server-firebase:** sync bill sponsorships with legislation metadata and id ([28776aa](https://github.com/legislative-tracker/legislative-tracker/commit/28776aa))

### 🩹 Fixes

- **workspace:** add implicit dependencies to root package for release versioning ([d7c2fd0](https://github.com/legislative-tracker/legislative-tracker/commit/d7c2fd0))
- **server-firebase:** ensure default firebase app is initialized ([a93082f](https://github.com/legislative-tracker/legislative-tracker/commit/a93082f))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.11 (2026-08-22)

### ⚠️ Breaking Changes

- **workspace:** pivot legislative architecture to OpenStates schema and plugin system ([2a320f4](https://github.com/legislative-tracker/legislative-tracker/commit/2a320f4))

### 🚀 Features

- **client-angular:** add edit-bill component to admin feature module ([8579e6d](https://github.com/legislative-tracker/legislative-tracker/commit/8579e6d))
- **shared:** add chamber column to USER_REPS_COLS ([fec7b45](https://github.com/legislative-tracker/legislative-tracker/commit/fec7b45))
- **shared:** add USER_REPS_COLS column configuration ([f29bff6](https://github.com/legislative-tracker/legislative-tracker/commit/f29bff6))
- **client-angular:** update legislation page title dynamically ([870c850](https://github.com/legislative-tracker/legislative-tracker/commit/870c850))
- **client-angular:** enhance bill detail table and member detail title ([9b4c295](https://github.com/legislative-tracker/legislative-tracker/commit/9b4c295))
- **client-angular:** convert legislation chamber bills to tabs and refine bill details ([36f5e40](https://github.com/legislative-tracker/legislative-tracker/commit/36f5e40))
- **client-angular:** scaffold legislation component and detail route ([4ec5b6e](https://github.com/legislative-tracker/legislative-tracker/commit/4ec5b6e))
- **shared:** dynamic bill column labels pulling chamber names from plugin ([2de8ef6](https://github.com/legislative-tracker/legislative-tracker/commit/2de8ef6))
- **server-firebase:** update onBillWritten and sync-sponsorships for ocd-bill ([82266bd](https://github.com/legislative-tracker/legislative-tracker/commit/82266bd))
- **server-firebase:** refactor add-bill to add-bills callable function ([1fafb12](https://github.com/legislative-tracker/legislative-tracker/commit/1fafb12))
- **server-firebase:** update legislation service to target ocd-bill collection ([6b69e6c](https://github.com/legislative-tracker/legislative-tracker/commit/6b69e6c))
- **server-firebase:** update legislators service to target ocd-person collection ([4b13885](https://github.com/legislative-tracker/legislative-tracker/commit/4b13885))
- **core:** implement updateMembers business logic function ([c595666](https://github.com/legislative-tracker/legislative-tracker/commit/c595666))
- **core:** implement updateBills business logic function ([485c073](https://github.com/legislative-tracker/legislative-tracker/commit/485c073))
- **core:** implement getNewBill and refactor openstates bill accessors ([be1fa22](https://github.com/legislative-tracker/legislative-tracker/commit/be1fa22))
- **plugins:** make plugin-leg-us-ny a publishable npm package ([1b513b2](https://github.com/legislative-tracker/legislative-tracker/commit/1b513b2))
- **plugins:** implement LegUsNyPlugin class and session calculation ([4fea615](https://github.com/legislative-tracker/legislative-tracker/commit/4fea615))
- **plugins:** add calculateCurrentSession method and session property ([1af8019](https://github.com/legislative-tracker/legislative-tracker/commit/1af8019))
- **plugins:** implement plugin registry and legislative plugin interfaces ([3591545](https://github.com/legislative-tracker/legislative-tracker/commit/3591545))
- **plugins:** implement addBill function for OpenStates API data access ([13eae5e](https://github.com/legislative-tracker/legislative-tracker/commit/13eae5e))
- **plugins:** implement getBill function for OpenStates API data access ([c2a7c59](https://github.com/legislative-tracker/legislative-tracker/commit/c2a7c59))
- **plugins:** implement getMembers function for OpenStates API data access ([05239b4](https://github.com/legislative-tracker/legislative-tracker/commit/05239b4))
- **workspace:** scaffold new plugin and data-access Nx projects ([c404fde](https://github.com/legislative-tracker/legislative-tracker/commit/c404fde))
- **shared:** add OpenStates bill and people API interfaces ([07ff278](https://github.com/legislative-tracker/legislative-tracker/commit/07ff278))

### 🩹 Fixes

- **core:** add missing plugins-leg-us-ny dependency to server-util-core package.json ([893ce4a](https://github.com/legislative-tracker/legislative-tracker/commit/893ce4a))
- **client-angular:** update bill table route type to navigation path legislation ([93ce0f8](https://github.com/legislative-tracker/legislative-tracker/commit/93ce0f8))
- **client-angular:** update default redirect route to canonical jurisdiction code ([30dc040](https://github.com/legislative-tracker/legislative-tracker/commit/30dc040))
- **client-angular:** normalize jurisdiction code and update legislation fetching ([318b4eb](https://github.com/legislative-tracker/legislative-tracker/commit/318b4eb))

### 🔥 Performance

- **server-firebase:** add lazy proxy getters for Firestore and Auth to reduce cold-start latency ([525ae74](https://github.com/legislative-tracker/legislative-tracker/commit/525ae74))
- **client-angular:** enable granular feature route code-splitting and sub-path imports ([40effe8](https://github.com/legislative-tracker/legislative-tracker/commit/40effe8))

### 💅 Refactors

- **shared:** centralize request/response interfaces and deduplicate model definitions ([7499d29](https://github.com/legislative-tracker/legislative-tracker/commit/7499d29))
- **client-angular:** replace alert dialog with snackbar in profile component ([cae4771](https://github.com/legislative-tracker/legislative-tracker/commit/cae4771))
- **client-angular:** update remove-bill component for new backend ([2127d78](https://github.com/legislative-tracker/legislative-tracker/commit/2127d78))
- **client-angular:** update profile test for chamber column ([34646c2](https://github.com/legislative-tracker/legislative-tracker/commit/34646c2))
- **server-firebase:** add chamber property to UserRepresentative ([50b60d2](https://github.com/legislative-tracker/legislative-tracker/commit/50b60d2))
- **client-angular:** update profile representative table route navigation ([55a55b6](https://github.com/legislative-tracker/legislative-tracker/commit/55a55b6))
- **client-angular:** support ocdId resolution in TableComponent ([6695e92](https://github.com/legislative-tracker/legislative-tracker/commit/6695e92))
- **client-angular:** update profile representatives table columns ([6477068](https://github.com/legislative-tracker/legislative-tracker/commit/6477068))
- **server-firebase:** standardize fetchUserReps to UserRepresentative schema ([6b2d1c3](https://github.com/legislative-tracker/legislative-tracker/commit/6b2d1c3))
- **server-firebase:** write single legislation document for bicameral bills ([33c3391](https://github.com/legislative-tracker/legislative-tracker/commit/33c3391))
- **client-angular:** update legislative views and services to OpenStates models ([a7bc2fb](https://github.com/legislative-tracker/legislative-tracker/commit/a7bc2fb))
- **server-firebase:** default to plugin jurisdiction code and update firestore rules ([800f2ef](https://github.com/legislative-tracker/legislative-tracker/commit/800f2ef))
- **server-firebase:** update removeBill for ocd-bill deletion ([67413fc](https://github.com/legislative-tracker/legislative-tracker/commit/67413fc))
- **server-firebase:** extract formatDocId and UpdateResult into helpers module ([9512aac](https://github.com/legislative-tracker/legislative-tracker/commit/9512aac))
- **core:** extract findPluginForState into dedicated module ([5b3f8f4](https://github.com/legislative-tracker/legislative-tracker/commit/5b3f8f4))
- **core:** extract DEFAULT_BILL_INCLUDES to constants module in openstates ([0156ee3](https://github.com/legislative-tracker/legislative-tracker/commit/0156ee3))
- **shared:** relocate OpenStates models to shared-models library ([8043b02](https://github.com/legislative-tracker/legislative-tracker/commit/8043b02))
- **workspace:** unregister and remove 6 obsolete Nx project libraries ([389b0a8](https://github.com/legislative-tracker/legislative-tracker/commit/389b0a8))
- **workspace:** rename Nx projects with domain prefixes ([dbc9bc6](https://github.com/legislative-tracker/legislative-tracker/commit/dbc9bc6))
- **workspace:** rename Nx projects with domain prefixes ([95d4b5b](https://github.com/legislative-tracker/legislative-tracker/commit/95d4b5b))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.10 (2026-08-17)

### 🚀 Features

- **client-angular:** extract social media handles and render with FontAwesome Brands icons ([59bfb2a](https://github.com/legislative-tracker/legislative-tracker/commit/59bfb2a))
- **client-angular:** add office address links and responsive layout to member detail ([c35e155](https://github.com/legislative-tracker/legislative-tracker/commit/c35e155))

### 🩹 Fixes

- **release:** sync server-firebase package.json in release workflow ([385977e](https://github.com/legislative-tracker/legislative-tracker/commit/385977e))

### 💅 Refactors

- **client-angular:** remove redundant Bill Sponsorships heading from member detail page ([9e7da1f](https://github.com/legislative-tracker/legislative-tracker/commit/9e7da1f))
- **client-angular:** remove redundant Bill Sponsorships heading from member detail page ([e5388cd](https://github.com/legislative-tracker/legislative-tracker/commit/e5388cd))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.9 (2026-08-16)

### 🚀 Features

- **client-angular:** add search-by-column to TableComponent ([b2b5fe4](https://github.com/legislative-tracker/legislative-tracker/commit/b2b5fe4))
- **client-angular:** add search-by-column to TableComponent ([872d477](https://github.com/legislative-tracker/legislative-tracker/commit/872d477))
- **client-angular:** auto-close navigation menu on mobile click ([4afbe6e](https://github.com/legislative-tracker/legislative-tracker/commit/4afbe6e))
- **client-angular:** enhance bill detail page with cards and activity timeline ([971b354](https://github.com/legislative-tracker/legislative-tracker/commit/971b354))
- **client-angular:** convert bill summary section to mat-expansion-panel ([371737c](https://github.com/legislative-tracker/legislative-tracker/commit/371737c))
- **client-angular:** convert bill detail header to mat-card and align expansion panel styling ([dc2e1e2](https://github.com/legislative-tracker/legislative-tracker/commit/dc2e1e2))
- **client-angular:** convert summary to mat-card and add dividers to activity list ([1a3a446](https://github.com/legislative-tracker/legislative-tracker/commit/1a3a446))
- **client-angular:** show latest action summary in collapsed activity panel description ([add67a5](https://github.com/legislative-tracker/legislative-tracker/commit/add67a5))
- **client-angular:** wrap bill detail activity list in collapsed mat-expansion-panel ([61f246e](https://github.com/legislative-tracker/legislative-tracker/commit/61f246e))
- **client-angular:** convert bill detail activity list to Angular Material mat-list ([03d48aa](https://github.com/legislative-tracker/legislative-tracker/commit/03d48aa))
- **client-angular:** add billActions timeline mapping and version sorting to bill detail ([f0101c2](https://github.com/legislative-tracker/legislative-tracker/commit/f0101c2))
- **client-angular:** add responsive info panel to bill detail view ([99a0140](https://github.com/legislative-tracker/legislative-tracker/commit/99a0140))
- **shared:** add latest_action_date column to bill column config ([697bbaf](https://github.com/legislative-tracker/legislative-tracker/commit/697bbaf))

### 🩹 Fixes

- **ci:** use explicit x-access-token authentication URL for release git push ([3f6698b](https://github.com/legislative-tracker/legislative-tracker/commit/3f6698b))
- **ci:** support ADMIN_PAT token in release workflow for branch protection bypass ([57354d0](https://github.com/legislative-tracker/legislative-tracker/commit/57354d0))
- **ci:** add actions/checkout before calling local setup action ([db0c5a4](https://github.com/legislative-tracker/legislative-tracker/commit/db0c5a4))
- **client-angular:** mobile nav auto-close and column config updates ([99c0606](https://github.com/legislative-tracker/legislative-tracker/commit/99c0606))
- **shared:** reorder member columns and remove unused version from sponsorship columns ([7b0bc2d](https://github.com/legislative-tracker/legislative-tracker/commit/7b0bc2d))
- **shared:** streamline bill table column configuration ([b7b789d](https://github.com/legislative-tracker/legislative-tracker/commit/b7b789d))
- **plugins:** add null safety for actions and restore Original key in getCosponsors ([a761577](https://github.com/legislative-tracker/legislative-tracker/commit/a761577))
- **plugins:** populate actions items and key initial amendment version in NY plugin ([bc4345a](https://github.com/legislative-tracker/legislative-tracker/commit/bc4345a))
- **shared:** update bill table column config and format NY action dates ([e8d2ce9](https://github.com/legislative-tracker/legislative-tracker/commit/e8d2ce9))
- **plugins:** format NY openlegislation first_action_date to YYYY-MM-DD string ([0a57926](https://github.com/legislative-tracker/legislative-tracker/commit/0a57926))
- **shared:** update bill column config key to use first_action_date ([60149d0](https://github.com/legislative-tracker/legislative-tracker/commit/60149d0))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.8 (2026-08-15)

### 🩹 Fixes

- **deps:** approve lmdb v3.5.6 script and sync server-firebase package-lock ([bc9902d](https://github.com/legislative-tracker/legislative-tracker/commit/bc9902d))
- **deps:** approve lmdb v3.5.6 script and sync server-firebase package-lock ([25c127e](https://github.com/legislative-tracker/legislative-tracker/commit/25c127e))
- **server-firebase:** align graphql dependency version for Cloud Functions deployment ([ea29a8d](https://github.com/legislative-tracker/legislative-tracker/commit/ea29a8d))
- **server-firebase:** align graphql dependency version with firebase-functions peer range ([c88792f](https://github.com/legislative-tracker/legislative-tracker/commit/c88792f))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.7 (2026-08-15)

### 🩹 Fixes

- **ci:** set production_cwa environment for Firebase deployment workflow ([c638122](https://github.com/legislative-tracker/legislative-tracker/commit/c638122))
- **ci:** set production_cwa environment for Firebase deployment workflow ([f962552](https://github.com/legislative-tracker/legislative-tracker/commit/f962552))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.6 (2026-08-15)

### 🚀 Features

- **workspace:** update e2e npm scripts to run sequential nx run-many ([78df9e5](https://github.com/legislative-tracker/legislative-tracker/commit/78df9e5))
- **workspace:** add e2e npm script ([bb76b28](https://github.com/legislative-tracker/legislative-tracker/commit/bb76b28))

### 💅 Refactors

- **workspace:** migrate Playwright to @nx/playwright/plugin inferred targets ([3658e1a](https://github.com/legislative-tracker/legislative-tracker/commit/3658e1a))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.5 (2026-08-15)

### 🚀 Features

- **client-angular:** add Playwright E2E tests, IndexedDB offline sync, and axe-core a11y audits ([185bffb](https://github.com/legislative-tracker/legislative-tracker/commit/185bffb))
- **client-angular:** add accessibility enhancements and axe-core E2E audits ([803c79d](https://github.com/legislative-tracker/legislative-tracker/commit/803c79d))
- **client-angular:** add offline IndexedDB storage and status banner ([73f5ac2](https://github.com/legislative-tracker/legislative-tracker/commit/73f5ac2))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.4 (2026-08-15)

### 🚀 Features

- **repo:** finalize zoneless Angular, Knip cleanup, PWA offline caching, and emulator tests ([e62e80a](https://github.com/legislative-tracker/legislative-tracker/commit/e62e80a))
- **client-angular:** configure service worker PWA offline caching strategy ([84b8890](https://github.com/legislative-tracker/legislative-tracker/commit/84b8890))

### 💅 Refactors

- **workspace:** optimize monorepo architecture, plugin registry, and change detection ([488880c](https://github.com/legislative-tracker/legislative-tracker/commit/488880c))
- **workspace:** optimize monorepo architecture, plugin registry, and change detection ([2575499](https://github.com/legislative-tracker/legislative-tracker/commit/2575499))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.3 (2026-08-14)

### 🩹 Fixes

- **deps:** synchronize package-lock.json for npm ci compliance ([62662a2](https://github.com/legislative-tracker/legislative-tracker/commit/62662a2))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.2 (2026-08-14)

### 🩹 Fixes

- **release:** comply with tag protection rules by avoiding force-push on git tags ([2623b3e](https://github.com/legislative-tracker/legislative-tracker/commit/2623b3e))
- **release:** check tag existence before creation and remove force push on tags to comply with protected tag rules ([187a3b5](https://github.com/legislative-tracker/legislative-tracker/commit/187a3b5))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.1 (2026-08-14)

### 🚀 Features

- **release:** use create-pull-request for automated release PRs ([03e47dd](https://github.com/legislative-tracker/legislative-tracker/commit/03e47dd))
- **release:** use create-pull-request for release PRs on protected main branch ([72b7e56](https://github.com/legislative-tracker/legislative-tracker/commit/72b7e56))
- **tools:** add dependabot config and knip for dead code analysis ([ed2a776](https://github.com/legislative-tracker/legislative-tracker/commit/ed2a776))
- **ci:** add pr title semantic validation and ci formatting check ([281344a](https://github.com/legislative-tracker/legislative-tracker/commit/281344a))
- **ci:** configure commitlint, lint-staged, and husky hooks ([3be8d5a](https://github.com/legislative-tracker/legislative-tracker/commit/3be8d5a))
- **client-angular:** add matSort to TableComponent with default sorting on Title header ([d0358ab](https://github.com/legislative-tracker/legislative-tracker/commit/d0358ab))
- **ci:** automate semver releases on main and sync footer appVersion ([b493586](https://github.com/legislative-tracker/legislative-tracker/commit/b493586))

### 🩹 Fixes

- **release:** move git options to release.version.git and release.changelog.git in nx.json ([399fd1b](https://github.com/legislative-tracker/legislative-tracker/commit/399fd1b))
- **release:** move git options under release.version.git and release.changelog.git in nx.json ([b62a066](https://github.com/legislative-tracker/legislative-tracker/commit/b62a066))
- **release:** disable automatic nx release git tag creation to prevent duplicate tag errors ([bec32b8](https://github.com/legislative-tracker/legislative-tracker/commit/bec32b8))
- **release:** disable automatic nx release git tag creation to prevent duplicate tag errors ([194652f](https://github.com/legislative-tracker/legislative-tracker/commit/194652f))
- **release:** configure fallbackCurrentVersionResolver to disk in nx.json ([543dbc1](https://github.com/legislative-tracker/legislative-tracker/commit/543dbc1))
- **release:** push release commits from detached HEAD to main branch and force tag update ([6316302](https://github.com/legislative-tracker/legislative-tracker/commit/6316302))
- **release:** explicitly set currentVersionResolver to git-tag in nx.json ([5fb45a1](https://github.com/legislative-tracker/legislative-tracker/commit/5fb45a1))
- **release:** explicitly set currentVersionResolver to git-tag in nx.json ([ad332cf](https://github.com/legislative-tracker/legislative-tracker/commit/ad332cf))
- **release:** add explicit git fetch tags step in release CI workflow ([72c2abf](https://github.com/legislative-tracker/legislative-tracker/commit/72c2abf))
- **release:** add git fetch tags step in release workflow ([d326a24](https://github.com/legislative-tracker/legislative-tracker/commit/d326a24))
- **release:** clean up nx.json schema warnings for defaultBase and version ([23ff7fe](https://github.com/legislative-tracker/legislative-tracker/commit/23ff7fe))
- **release:** target root project @legislative-tracker/source for app release group ([3924f45](https://github.com/legislative-tracker/legislative-tracker/commit/3924f45))
- **release:** limit app group target to root project ([3b97999](https://github.com/legislative-tracker/legislative-tracker/commit/3b97999))
- **release:** point app group to root project @legislative-tracker/source ([09a0b9f](https://github.com/legislative-tracker/legislative-tracker/commit/09a0b9f))
- **release:** point app group to root project @legislative-tracker/source ([a1bc434](https://github.com/legislative-tracker/legislative-tracker/commit/a1bc434))
- **release:** configure fallbackCurrentVersionResolver to disk in nx.json ([8704aeb](https://github.com/legislative-tracker/legislative-tracker/commit/8704aeb))
- **release:** configure fallbackCurrentVersionResolver to disk in nx.json ([bf09b90](https://github.com/legislative-tracker/legislative-tracker/commit/bf09b90))
- **release:** specify client-angular project and conventionalCommits mapping in nx.json ([ba79c55](https://github.com/legislative-tracker/legislative-tracker/commit/ba79c55))
- **release:** specify client-angular project and conventionalCommits mapping in nx.json ([a4dda58](https://github.com/legislative-tracker/legislative-tracker/commit/a4dda58))
- **deps:** align angular, vitest, and graphql versions to resolve ERESOLVE peer conflicts ([ff6f946](https://github.com/legislative-tracker/legislative-tracker/commit/ff6f946))
- **deps:** align angular, vitest, and graphql versions to resolve peer dependency conflicts ([871d3ac](https://github.com/legislative-tracker/legislative-tracker/commit/871d3ac))
- **release:** place changelog in docs folder, bypass husky in CI, and prevent duplicate tag errors ([b1b2b0d](https://github.com/legislative-tracker/legislative-tracker/commit/b1b2b0d))
- **ci:** configure automaticFromRef and fetch-tags for nx release ([da19895](https://github.com/legislative-tracker/legislative-tracker/commit/da19895))
- **ci:** remove invalid --yes flags and update nx release config in release workflow ([96d9853](https://github.com/legislative-tracker/legislative-tracker/commit/96d9853))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.11.0 (2026-08-14)

### 🚀 Features

- **server-firebase:** auto update legislator sponsorships on bill write and enforce canonical bill ID ([d2a7eab](https://github.com/legislative-tracker/legislative-tracker/commit/d2a7eab))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.10.1 (2026-08-14)

### 🚀 Features

- **plugins:** implement LegislaturePluginRegistry and publishable plugin apparatus ([b5599cd](https://github.com/legislative-tracker/legislative-tracker/commit/b5599cd))

### 🩹 Fixes

- **client-angular:** reset TestBed in beforeEach/afterEach and set Vitest pool forks for CI isolation ([6d5745a](https://github.com/legislative-tracker/legislative-tracker/commit/6d5745a))
- **client-angular:** prevent duplicate TestBed initTestEnvironment error in Vitest ([bf7c920](https://github.com/legislative-tracker/legislative-tracker/commit/bf7c920))
- update image-size dependency version and synchronize package-lock.json ([ab7973c](https://github.com/legislative-tracker/legislative-tracker/commit/ab7973c))
- **ci:** ignore .agents directory in gitignore ([269134d](https://github.com/legislative-tracker/legislative-tracker/commit/269134d))
- **ci:** guard testbed init and resolve package vulnerabilities ([ee52aa4](https://github.com/legislative-tracker/legislative-tracker/commit/ee52aa4))
- **toolchain:** resolve CI test failures, dependency vulnerabilities, and Nx deprecation warnings ([8adc3ea](https://github.com/legislative-tracker/legislative-tracker/commit/8adc3ea))
- **deps:** explicitly declare @emnapi dependencies to sync lockfile for CI ([d6b454c](https://github.com/legislative-tracker/legislative-tracker/commit/d6b454c))
- **lint:** replace dynamic import in util-core spec with static import ([6e1c2d0](https://github.com/legislative-tracker/legislative-tracker/commit/6e1c2d0))
- **plugins:** use wildcard peerDependency for workspace package resolution ([c2736ed](https://github.com/legislative-tracker/legislative-tracker/commit/c2736ed))
- **client-angular:** stabilize firestore adapters, rules, and bill resolution ([ccb650d](https://github.com/legislative-tracker/legislative-tracker/commit/ccb650d))

### 💅 Refactors

- **client-angular:** modernize app.config.ts and remove deprecated provideAnimationsAsync ([b12320c](https://github.com/legislative-tracker/legislative-tracker/commit/b12320c))
- migrate away from deprecated tools, plugins, and vitest configs ([e7d1499](https://github.com/legislative-tracker/legislative-tracker/commit/e7d1499))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.10.0 (2026-08-13)

### 🚀 Features

- **ci:** add GitHub Actions workflow with Nx Affected and finalize Phase 4 modernization ([6578caf](https://github.com/legislative-tracker/legislative-tracker/commit/6578caf))
- **firebase:** codify security rules, indexes, and add automated emulator test target ([ef12dda](https://github.com/legislative-tracker/legislative-tracker/commit/ef12dda))
- **client-angular:** complete zoneless migration and signal input refactoring ([97733e5](https://github.com/legislative-tracker/legislative-tracker/commit/97733e5))
- **nx:** enforce matrix-based tagging and module boundary lint rules ([9f195be](https://github.com/legislative-tracker/legislative-tracker/commit/9f195be))

### 🩹 Fixes

- **tsconfig:** exclude spec files and refine include patterns in server-firebase tsconfig ([4a45291](https://github.com/legislative-tracker/legislative-tracker/commit/4a45291))

### 💅 Refactors

- **config:** remove legacy @app-* path wildcards ([e1a9961](https://github.com/legislative-tracker/legislative-tracker/commit/e1a9961))
- **client-angular:** merge data-access-legislature into core library ([cc49156](https://github.com/legislative-tracker/legislative-tracker/commit/cc49156))
- **client-angular:** decouple data access layer using adapter pattern and inject firestore DI token ([641d841](https://github.com/legislative-tracker/legislative-tracker/commit/641d841))
- modularize server and plugin libraries into single-responsibility modules ([ec62c11](https://github.com/legislative-tracker/legislative-tracker/commit/ec62c11))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud

## 0.9.0 (2026-08-12)

### 🚀 Features

- **client-angular:** configure client to import and load emulator settings from assets/config.json ([cce7291](https://github.com/legislative-tracker/legislative-tracker/commit/cce7291))
- **server-firebase:** add emulator data export configuration and port cleanup ([0572a0b](https://github.com/legislative-tracker/legislative-tracker/commit/0572a0b))
- **firebase:** add auth emulator and client fallback for local development ([2163ba7](https://github.com/legislative-tracker/legislative-tracker/commit/2163ba7))
- **server-firebase:** configure serve target and firebase emulators for functions, firestore, and pubsub ([f5d1496](https://github.com/legislative-tracker/legislative-tracker/commit/f5d1496))
- migrate project architecture to Nx Monorepo v0.8.4 ([bee50fc](https://github.com/legislative-tracker/legislative-tracker/commit/bee50fc))

### 🩹 Fixes

- **config:** update GitHub repository URL in runtime config ([4d76baa](https://github.com/legislative-tracker/legislative-tracker/commit/4d76baa))
- **legislators:** refine data sync, image validation, and got to fetch migration ([7b4e2a2](https://github.com/legislative-tracker/legislative-tracker/commit/7b4e2a2))
- **firebase:** align emulator project ID and resolve CORS preflight errors ([aca07dd](https://github.com/legislative-tracker/legislative-tracker/commit/aca07dd))
- **lint:** resolve ESLint configuration and circular module dependencies ([bbfb1a8](https://github.com/legislative-tracker/legislative-tracker/commit/bbfb1a8))
- **tests:** resolve monorepo import paths and Vitest test suite configurations ([3037d2e](https://github.com/legislative-tracker/legislative-tracker/commit/3037d2e))

### ❤️ Thank You

- Joshua Pelton-Stroud @jpelton-stroud
