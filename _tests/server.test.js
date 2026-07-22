import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createEditorServer } from '../_tools/article-manager/server.js';

function validLibrary(title = '文章标题') {
  return {
    meta: { schemaVersion: 1, updatedAt: '2026-07-22T00:00:00.000Z' },
    categories: [{ id: 'game-design', name: '游戏设计' }],
    tags: [],
    articles: [{
      id: 'article-1',
      url: 'https://example.com/article',
      title,
      recommendation: '推荐理由',
      categoryId: 'game-design',
      tagIds: [],
      status: 'draft',
      createdAt: '2026-07-22T00:00:00.000Z',
      updatedAt: '2026-07-22T00:00:00.000Z',
      publishedAt: null,
    }],
  };
}

async function withServer(callback) {
  const directory = await mkdtemp(join(tmpdir(), 'article-manager-server-'));
  const managerDir = join(directory, 'manager');
  const siteDir = join(directory, 'site');
  const readingDir = join(siteDir, 'reading');
  const dataDir = join(siteDir, 'data');
  const dataFile = join(dataDir, 'reading-library.json');
  await mkdir(managerDir);
  await mkdir(readingDir, { recursive: true });
  await mkdir(dataDir, { recursive: true });
  await writeFile(join(managerDir, 'index.html'), '<!doctype html><title>Manager</title>');
  await writeFile(join(managerDir, 'manager.js'), 'console.log("manager")');
  await writeFile(join(readingDir, 'index.html'), '<!doctype html><title>Reading</title>');
  await writeFile(join(readingDir, 'reading.js'), 'console.log("reading")');
  await writeFile(dataFile, `${JSON.stringify(validLibrary(), null, 2)}\n`);

  const server = createEditorServer({ dataFile, managerDir, siteDir });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;

  try {
    await callback({ origin, dataFile });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(directory, { recursive: true, force: true });
  }
}

test('GET /api/library returns the validated library', async () => {
  await withServer(async ({ origin }) => {
    const response = await fetch(`${origin}/api/library`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).articles[0].title, '文章标题');
  });
});

test('PUT /api/library persists valid JSON', async () => {
  await withServer(async ({ origin, dataFile }) => {
    const changed = validLibrary('修改后');
    const response = await fetch(`${origin}/api/library`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify(changed),
    });

    assert.equal(response.status, 200);
    assert.equal((await response.json()).articles[0].title, '修改后');
    assert.equal(JSON.parse(await readFile(dataFile, 'utf8')).articles[0].title, '修改后');
  });
});

test('PUT rejects malformed JSON without changing the file', async () => {
  await withServer(async ({ origin, dataFile }) => {
    const before = await readFile(dataFile, 'utf8');
    const response = await fetch(`${origin}/api/library`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: '{broken',
    });

    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /JSON 格式错误/);
    assert.equal(await readFile(dataFile, 'utf8'), before);
  });
});

test('PUT rejects invalid library data without changing the file', async () => {
  await withServer(async ({ origin, dataFile }) => {
    const before = await readFile(dataFile, 'utf8');
    const invalid = validLibrary();
    invalid.articles[0].title = '';
    const response = await fetch(`${origin}/api/library`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalid),
    });

    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /数据校验失败/);
    assert.equal(await readFile(dataFile, 'utf8'), before);
  });
});

test('PUT rejects unsupported content types', async () => {
  await withServer(async ({ origin }) => {
    const response = await fetch(`${origin}/api/library`, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: '{}',
    });
    assert.equal(response.status, 415);
  });
});

test('PUT rejects bodies larger than one MiB', async () => {
  await withServer(async ({ origin }) => {
    const response = await fetch(`${origin}/api/library`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ padding: 'x'.repeat(1024 * 1024) }),
    });
    assert.equal(response.status, 413);
  });
});

test('PUT rejects writes from a foreign Origin', async () => {
  await withServer(async ({ origin }) => {
    const response = await fetch(`${origin}/api/library`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
      body: JSON.stringify(validLibrary()),
    });
    assert.equal(response.status, 403);
  });
});

test('serves only known files inside the manager directory', async () => {
  await withServer(async ({ origin }) => {
    const indexResponse = await fetch(`${origin}/`);
    assert.equal(indexResponse.status, 200);
    assert.match(indexResponse.headers.get('content-type'), /text\/html/);

    const scriptResponse = await fetch(`${origin}/manager.js`);
    assert.equal(scriptResponse.status, 200);
    assert.match(scriptResponse.headers.get('content-type'), /javascript/);

    assert.equal((await fetch(`${origin}/missing.js`)).status, 404);
    assert.equal((await fetch(`${origin}/..%2Fsecret.txt`)).status, 404);
  });
});

test('serves a read-only public preview without exposing local tools', async () => {
  await withServer(async ({ origin }) => {
    const reading = await fetch(`${origin}/reading/`);
    assert.equal(reading.status, 200);
    assert.match(await reading.text(), /<title>Reading<\/title>/);

    const data = await fetch(`${origin}/data/reading-library.json`);
    assert.equal(data.status, 200);
    assert.equal((await data.json()).articles[0].title, '文章标题');

    assert.equal((await fetch(`${origin}/_tools/article-manager/server.js`)).status, 404);
    assert.equal((await fetch(`${origin}/package.json`)).status, 404);
  });
});
