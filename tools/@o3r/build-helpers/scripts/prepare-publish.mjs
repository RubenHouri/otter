/*
 * The purpose of this script is to prepare the artifact to be published on registries
 * This includes the following steps:
 *   - Duplicate selected field from the root folder package.json to targeted package.json(default: 'contributors', 'bugs', 'repository', 'license')
 *   - Copy License file
 */

import minimist from 'minimist';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const argv = minimist(process.argv.slice(2));
const root = argv.root ? resolve(process.cwd(), argv.root) : process.cwd();
const /** @type { string[] } */ fields = argv.fields?.split(',') || ['contributors', 'bugs', 'repository', 'license'];
const distPath = argv._[0] || resolve(process.cwd(), 'dist');
const packageJsonPath = join(distPath, 'package.json');

/**
 * Find Private package.json
 *
 * @param {string} currentFolder
 */
const findPrivatePackage = (currentFolder) => {
  const inspectedPackage = resolve(currentFolder, 'package.json');
  if (existsSync(inspectedPackage)) {
    const pck = JSON.parse(readFileSync(inspectedPackage, {encoding: 'utf-8'}));
    if (pck.private) {
      return {
        content: pck,
        path: inspectedPackage
      };
    }
  }

  const parent = dirname(currentFolder);
  if (!parent || currentFolder === parent) {
    return null;
  }
  return findPrivatePackage(parent);
};

const privatePackageJson = findPrivatePackage(root);
const distPackageJson = resolve(root, packageJsonPath);

if (!packageJsonPath || !existsSync(distPackageJson)) {
  throw new Error('No package.json found');
}
if (!privatePackageJson) {
  throw new Error('No private package.json found');
}

const packageJson = JSON.parse(readFileSync(distPackageJson, { encoding: 'utf-8' }));

fields.forEach((field) => {
  packageJson[field] = privatePackageJson.content[field];
});

writeFileSync(distPackageJson, JSON.stringify(packageJson, null, 2));
copyFileSync(resolve(dirname(privatePackageJson.path), 'LICENSE'), resolve(distPath, 'LICENSE'));
