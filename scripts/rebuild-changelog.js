import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const changelogPath = path.join(rootDir, 'docs', 'CHANGELOG.md');
const REPO_URL = 'https://github.com/legislative-tracker/legislative-tracker';

const TYPE_CONFIG = {
  breaking: { title: '### ⚠️ Breaking Changes' },
  feat: { title: '### 🚀 Features' },
  fix: { title: '### 🩹 Fixes' },
  perf: { title: '### 🔥 Performance' },
  refactor: { title: '### 💅 Refactors' },
  docs: { title: '### 📖 Documentation' },
};

// 1. Get all version tags in chronological order
const tags = execSync('git tag --sort=creatordate -l "v*"', { cwd: rootDir })
  .toString()
  .trim()
  .split('\n')
  .map((t) => t.trim())
  .filter(Boolean);

console.log(`Found ${tags.length} release tag(s): ${tags.join(', ')}`);

if (tags.length === 0) {
  console.log('No release tags found.');
  process.exit(0);
}

const changelogEntries = [];

// 2. Process each tag
for (let i = 0; i < tags.length; i++) {
  const currentTag = tags[i];
  const version = currentTag.replace(/^v/, '');
  const prevTag = i > 0 ? tags[i - 1] : undefined;

  const date = execSync(`git log -1 --format=%cs ${currentTag}`, {
    cwd: rootDir,
  })
    .toString()
    .trim();

  const range = prevTag ? `${prevTag}..${currentTag}` : currentTag;
  const rawLog = execSync(
    `git log ${range} --pretty=format:"%H|%h|%s|%an|%ae%n%b%n---COMMIT-END---"`,
    { cwd: rootDir },
  ).toString();

  const commitsRaw = rawLog.split('---COMMIT-END---').filter((c) => c.trim());

  const categories = {
    breaking: [],
    feat: [],
    fix: [],
    perf: [],
    refactor: [],
    docs: [],
  };
  const authors = new Set();

  for (const raw of commitsRaw) {
    const lines = raw.trim().split('\n');
    const header = lines[0] || '';
    const [fullHash, shortHash, subject, authorName] = header.split('|');

    if (!subject) continue;
    if (
      subject.startsWith('Merge pull request') ||
      subject.startsWith('Merge branch')
    ) {
      continue;
    }
    if (
      subject.startsWith('chore(release):') ||
      subject.includes('[skip ci]')
    ) {
      continue;
    }
    if (
      authorName &&
      !authorName.includes('bot') &&
      !authorName.includes('github-actions')
    ) {
      authors.add(authorName);
    }

    const body = lines.slice(1).join('\n');
    const isBreaking =
      subject.includes('!:') ||
      body.includes('BREAKING CHANGE:') ||
      body.includes('BREAKING-CHANGE:');

    // Parse conventional commit: type(scope): subject or type: subject
    const match = subject.match(/^([a-zA-Z]+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);
    if (!match) continue;

    const [, type, scope, , desc] = match;
    const lowerType = type.toLowerCase();

    const commitLink = `([${shortHash}](${REPO_URL}/commit/${shortHash}))`;
    const formattedItem = scope
      ? `- **${scope}:** ${desc.trim()} ${commitLink}`
      : `- ${desc.trim()} ${commitLink}`;

    if (isBreaking) {
      categories.breaking.push(formattedItem);
    } else if (categories[lowerType]) {
      categories[lowerType].push(formattedItem);
    }
  }

  let entryMarkdown = `## ${version} (${date})\n\n`;

  let hasChanges = false;
  for (const [key, config] of Object.entries(TYPE_CONFIG)) {
    if (categories[key].length > 0) {
      hasChanges = true;
      entryMarkdown += `${config.title}\n\n`;
      entryMarkdown += categories[key].join('\n') + '\n\n';
    }
  }

  if (!hasChanges) {
    entryMarkdown += `This was a version bump only for @legislative-tracker/source to align it with other projects, there were no code changes.\n\n`;
  }

  if (authors.size > 0) {
    entryMarkdown += `### ❤️ Thank You\n\n`;
    for (const author of authors) {
      const handle =
        author === 'Joshua Pelton-Stroud' ? ' @jpelton-stroud' : '';
      entryMarkdown += `- ${author}${handle}\n`;
    }
    entryMarkdown += '\n';
  }

  changelogEntries.unshift(entryMarkdown.trim());
}

// 3. Write unified changelog
fs.mkdirSync(path.dirname(changelogPath), { recursive: true });
fs.writeFileSync(changelogPath, changelogEntries.join('\n\n') + '\n', 'utf8');

console.log('CHANGELOG.md successfully rebuilt for all releases.');
