import test from 'node:test';
import assert from 'node:assert/strict';
import { entryFiles } from '../scripts/prepare-legacy-pr.mjs';

test('legacy README changes do not block JSON extraction',()=>{
  assert.equal(entryFiles([{filename:'README.md',status:'modified'}, {filename:'servers/data/example/server.json',status:'added'}]), 'servers/data/example/server.json');
});
test('multi-server PR requires human review',()=>{
  assert.throws(()=>entryFiles([{filename:'servers/data/a/server.json',status:'added'},{filename:'servers/data/b/server.json',status:'added'}]), /Exactly one/);
});
test('removal-only PR requires human review',()=>{
  assert.throws(()=>entryFiles([{filename:'servers/data/a/server.json',status:'removed'}]), /Exactly one/);
});
