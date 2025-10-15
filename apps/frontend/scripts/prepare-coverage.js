/*
Prepares coverage for combined reporting by moving Jest coverage into .nyc_output.
- Copies coverage/coverage-final.json -> .nyc_output/coverage-unit.json
- Ensures .nyc_output directory exists
Then nyc can generate a combined report together with Cypress coverage.
*/

const fs = require('fs');
const path = require('path');

const root = __dirname ? path.join(__dirname, '..') : path.resolve('..');
const nycOutputDir = path.join(root, '.nyc_output');
const jestCoverageJson = path.join(root, 'coverage', 'coverage-final.json');
const destJson = path.join(nycOutputDir, 'coverage-unit.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main() {
  ensureDir(nycOutputDir);
  if (fs.existsSync(jestCoverageJson)) {
    fs.copyFileSync(jestCoverageJson, destJson);
    console.log(`Copied Jest coverage to ${path.relative(root, destJson)}`);
  } else {
    console.warn('Jest coverage JSON not found at', jestCoverageJson);
  }
}

main();
