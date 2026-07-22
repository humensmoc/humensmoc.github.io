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

test('category and Tag use matching inline management dropdowns', async () => {
  const html = await readFile(new URL('../_tools/article-manager/index.html', import.meta.url), 'utf8');
  const articleForm = html.match(/<form id="article-form">([\s\S]*?)<\/form>/)?.[1] ?? '';

  assert.match(articleForm, /id="category-picker" class="taxonomy-picker"/);
  assert.match(articleForm, /id="tag-picker" class="taxonomy-picker"/);
  assert.equal((articleForm.match(/class="taxonomy-dropdown"/g) ?? []).length, 2);
  assert.equal((articleForm.match(/class="taxonomy-add-form"/g) ?? []).length, 2);
  assert.equal((articleForm.match(/class="taxonomy-editor"/g) ?? []).length, 2);
  assert.doesNotMatch(articleForm, /class="taxonomy-add-form"[\s\S]*?<input[^>]+required/);
  assert.doesNotMatch(html, /<dialog/);

  const controller = await readFile(new URL('../_tools/article-manager/manager.js', import.meta.url), 'utf8');
  assert.match(controller, /addEventListener\('contextmenu'/);
  assert.match(controller, /!query\s*\|\|\s*name\.toLocaleLowerCase\(\)\.includes\(query\)/);
});
