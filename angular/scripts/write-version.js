#!/usr/bin/env node
// write-version.js — Pathways OI Trust
//
// Writes dist/<app>/browser/version.json after every ng build (postbuild
// hook). The Angular VersionCheckService fetches this file (no-cache) on
// boot and every 5 minutes; when the build_version field differs from the
// boot value, an "Update available" banner is shown to the user.
//
// build_version prefers the current git HEAD SHA; falls back to the
// process start ISO timestamp if git is unavailable or the working tree is
// not a repo. Either value is unique per deploy.
//
// CC-20-09 (Contract 20 — operational cache-busting).

'use strict';

const { execSync } = require('node:child_process');
const fs           = require('node:fs');
const path         = require('node:path');

const DIST_BROWSER = path.resolve(__dirname, '..', 'dist', 'pathways-oi-trust', 'browser');

function readGitSha() {
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function buildVersion() {
  const sha = readGitSha();
  if (sha) { return sha; }
  return new Date().toISOString();
}

function main() {
  if (!fs.existsSync(DIST_BROWSER)) {
    // ng build hasn't produced an output yet — nothing to do. Common in
    // test/lint workflows that also invoke postbuild via the npm lifecycle.
    process.stdout.write('[write-version] dist/.../browser not present — skipped\n');
    return;
  }

  const payload = {
    build_version: buildVersion(),
    built_at:      new Date().toISOString()
  };
  const target = path.join(DIST_BROWSER, 'version.json');
  fs.writeFileSync(target, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  process.stdout.write(`[write-version] wrote ${target} (build_version=${payload.build_version})\n`);
}

main();
