#!/usr/bin/env node
/**
 * Find exact duplicate files by content hash.
 * - Recursively walks from repo root (or provided dir)
 * - Excludes common vendor/build/log dirs
 * - Prints groups of duplicates with SHA256
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const EXCLUDED_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', 'dist', 'build', 'coverage', 'logs', 'uploads', '.next', '.cache'
]);
const INCLUDE_EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.sql', '.md', '.json', '.css', '.scss', '.yml', '.yaml']);

function shouldSkipDir(dir) {
  const base = path.basename(dir);
  return EXCLUDED_DIRS.has(base);
}

function shouldIncludeFile(file) {
  const ext = path.extname(file).toLowerCase();
  return INCLUDE_EXT.has(ext);
}

async function* walk(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!shouldSkipDir(full)) {
        yield* walk(full);
      }
    } else if (entry.isFile()) {
      if (shouldIncludeFile(full)) {
        yield full;
      }
    }
  }
}

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

(async () => {
  const groups = new Map(); // hash => [files]
  let count = 0;
  for await (const file of walk(ROOT)) {
    try {
      const h = await hashFile(file);
      if (!groups.has(h)) groups.set(h, []);
      groups.get(h).push(file);
      count++;
    } catch (err) {
      // ignore unreadable files
    }
  }

  let dupCount = 0;
  for (const [hash, files] of groups) {
    if (files.length > 1) {
      dupCount++;
      console.log(`--- DUPLICATE HASH: ${hash} (${files.length} files)`);
      files.sort().forEach((f) => console.log(`  ${path.relative(ROOT, f)}`));
    }
  }

  if (dupCount === 0) {
    console.log('No exact duplicate files found.');
  } else {
    console.log(`\nFound ${dupCount} duplicate groups.`);
  }
})().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
