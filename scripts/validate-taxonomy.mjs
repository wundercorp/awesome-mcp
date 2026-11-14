import fs from 'node:fs';
import path from 'node:path';
import { validateEntry } from './mcp-safety-review.mjs';

const root = path.resolve('servers');
const errors = [];
let count = 0;
function visit(dir) {
  for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, dirent.name);
    if (dirent.isDirectory()) visit(full);
    else if (dirent.name === 'server.json') {
      const rel = path.relative(process.cwd(), full).split(path.sep).join('/');
      try { validateEntry(rel, fs.readFileSync(full, 'utf8')); count++; }
      catch (err) { errors.push(`${rel}: ${err.message}`); }
    }
  }
}
visit(root);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log(`Validated taxonomy for ${count} MCP entries.`);
