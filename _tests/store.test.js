import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { readLibrary, writeLibrary } from '../_tools/article-manager/store.js';

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

async function withTempFile(callback) {
  const directory = await mkdtemp(join(tmpdir(), 'reading-library-'));
  const filePath = join(directory, 'library.json');
  try {
    await callback(filePath);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('reads and validates a library file', async () => {
  await withTempFile(async (filePath) => {
    await writeFile(filePath, JSON.stringify(validLibrary()));
    assert.equal((await readLibrary(filePath)).articles[0].title, '文章标题');
  });
});

test('rejects malformed JSON without rewriting it', async () => {
  await withTempFile(async (filePath) => {
    await writeFile(filePath, '{broken');
    await assert.rejects(() => readLibrary(filePath), /JSON 格式错误/);
    assert.equal(await readFile(filePath, 'utf8'), '{broken');
  });
});

test('rejects structurally invalid library data', async () => {
  await withTempFile(async (filePath) => {
    await writeFile(filePath, JSON.stringify({ categories: [] }));
    await assert.rejects(() => readLibrary(filePath), /数据校验失败/);
  });
});

test('writes formatted validated JSON with a trailing newline', async () => {
  await withTempFile(async (filePath) => {
    await writeLibrary(filePath, validLibrary());
    const text = await readFile(filePath, 'utf8');
    assert.equal(text.endsWith('\n'), true);
    assert.equal(JSON.parse(text).articles[0].title, '文章标题');
  });
});

test('does not replace valid data when validation fails', async () => {
  await withTempFile(async (filePath) => {
    const original = `${JSON.stringify(validLibrary(), null, 2)}\n`;
    await writeFile(filePath, original);
    const invalid = validLibrary();
    invalid.articles[0].title = '';

    await assert.rejects(() => writeLibrary(filePath, invalid), /数据校验失败/);
    assert.equal(await readFile(filePath, 'utf8'), original);
  });
});

test('does not replace valid data when rename fails', async () => {
  await withTempFile(async (filePath) => {
    const original = `${JSON.stringify(validLibrary(), null, 2)}\n`;
    await writeFile(filePath, original);

    await assert.rejects(() => writeLibrary(filePath, validLibrary('修改后'), {
      rename: async () => { throw new Error('rename failed'); },
    }), /rename failed/);
    assert.equal(await readFile(filePath, 'utf8'), original);
  });
});
