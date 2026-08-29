import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const versionArg = process.argv[2];
let targetVersion = versionArg;

const rootPkgPath = path.join(rootDir, 'package.json');
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));

if (!targetVersion) {
  targetVersion = rootPkg.version;
}

if (!targetVersion) {
  console.error('No version specified and root package.json has no version.');
  process.exit(1);
}

console.log(`Synchronizing app version to: ${targetVersion}`);

// 1. Root package.json
rootPkg.version = targetVersion;
fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n', 'utf8');
console.log(`- Updated ${path.relative(rootDir, rootPkgPath)}`);

// 2. apps/server-firebase/package.json
const serverPkgPath = path.join(rootDir, 'apps/server-firebase/package.json');
if (fs.existsSync(serverPkgPath)) {
  const serverPkg = JSON.parse(fs.readFileSync(serverPkgPath, 'utf8'));
  serverPkg.version = targetVersion;
  fs.writeFileSync(
    serverPkgPath,
    JSON.stringify(serverPkg, null, 2) + '\n',
    'utf8',
  );
  console.log(`- Updated ${path.relative(rootDir, serverPkgPath)}`);
}

// 3. libs/client-angular/core/src/lib/version.ts
const versionTsPath = path.join(
  rootDir,
  'libs/client-angular/core/src/lib/version.ts',
);
const versionTsContent = `/**
 * Current semantic release version of the client application.
 * Automatically synchronized during release pipelines via scripts/sync-version.js.
 */
export const APP_VERSION = '${targetVersion}';
`;
fs.writeFileSync(versionTsPath, versionTsContent, 'utf8');
console.log(`- Updated ${path.relative(rootDir, versionTsPath)}`);

console.log('Version synchronization complete!');
