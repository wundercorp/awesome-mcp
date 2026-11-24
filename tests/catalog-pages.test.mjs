import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { renderCatalog, synchronize, GENERATED_MARKER } from '../scripts/generate-readme.mjs';

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-catalog-pages-'));
  fs.mkdirSync(path.join(root, 'config'), { recursive: true });
  fs.writeFileSync(path.join(root,'config/mcp-taxonomy.json'), JSON.stringify({primary_categories:{data:'Data APIs',security:'Security scanning'}}));
  fs.mkdirSync(path.join(root,'servers/data/example'), { recursive: true });
  fs.writeFileSync(path.join(root,'servers/data/example/server.json'), JSON.stringify({slug:'example', category:'data',name:'Example MCP', description:'Example read-only API', homepage_url:'https://example.org', repository_url:'https://github.com/example/repo', transports:['stdio']}));
  return root;
}

test('homepage has only category links, no project links', t => {
  const dir = fixture(); t.after(() => fs.rmSync(dir,{recursive:true,force:true}));
  const {outputs, entryCount} = renderCatalog(dir);
  assert.equal(entryCount,1);
  assert.match(outputs.get('README.md'), /categories\/data\.md/);
  assert.doesNotMatch(outputs.get('README.md'), /example\.org|github\.com\/example|Example MCP/);
  assert.match(outputs.get('categories/data.md'), /example\.org/);
  assert.match(outputs.get('categories/security.md'), /No MCP servers/);
});

test('generated pages are deterministic and check detects drift', t => {
  const dir = fixture(); t.after(() => fs.rmSync(dir,{recursive:true,force:true}));
  synchronize(dir); assert.deepEqual(synchronize(dir,true).changed,[]);
  fs.appendFileSync(path.join(dir,'README.md'), 'bad edit');
  assert.throws(()=>synchronize(dir,true), /stale/);
  synchronize(dir); assert.deepEqual(synchronize(dir,true).changed,[]);
});

test('only stale generated category pages are deleted', t => {
  const dir = fixture(); t.after(() => fs.rmSync(dir,{recursive:true,force:true}));
  synchronize(dir);
  fs.writeFileSync(path.join(dir,'categories/old.md'), `${GENERATED_MARKER}\nold\n`);
  fs.writeFileSync(path.join(dir,'categories/custom.md'), 'Manual notes\n');
  synchronize(dir);
  assert.equal(fs.existsSync(path.join(dir,'categories/old.md')),false);
  assert.equal(fs.existsSync(path.join(dir,'categories/custom.md')),true);
});

test('unknown category is not silently placed on homepage', t=>{
  const dir=fixture();t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  fs.mkdirSync(path.join(dir,'servers/unknown/rogue'),{recursive:true});
  fs.writeFileSync(path.join(dir,'servers/unknown/rogue/server.json'), JSON.stringify({slug:'rogue',category:'unknown'}));
  assert.throws(()=>renderCatalog(dir),/Unknown category/);
});
