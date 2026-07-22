import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('GitHub Pages configuration excludes local-only tools', async () => {
  const config = await readFile(new URL('../_config.yml', import.meta.url), 'utf8');
  assert.match(config, /^\s*- _tools\s*$/m);
  assert.match(config, /^\s*- _tests\s*$/m);
});

test('browser controllers avoid HTML string injection APIs', async () => {
  const files = [
    new URL('../reading/reading.js', import.meta.url),
    new URL('../_tools/article-manager/manager.js', import.meta.url),
  ];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /\.innerHTML\s*=/);
    assert.doesNotMatch(source, /insertAdjacentHTML/);
  }
});

test('homepage links to the public design article library', async () => {
  const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(home, /href="\/reading\/"/);
});

test('async form handlers capture their form before awaiting', async () => {
  const source = await readFile(new URL('../_tools/article-manager/manager.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /event\.currentTarget\.reset\(\)/);
  assert.equal((source.match(/const form = event\.currentTarget;/g) ?? []).length, 2);
});

test('category and Tag management controls live beside article fields', async () => {
  const html = await readFile(new URL('../_tools/article-manager/index.html', import.meta.url), 'utf8');
  const articleForm = html.match(/<form id="article-form">([\s\S]*?)<\/form>/)?.[1] ?? '';

  assert.match(articleForm, /id="manage-categories"/);
  assert.match(articleForm, /id="manage-tags"/);
});
