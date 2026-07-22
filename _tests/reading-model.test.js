import test from 'node:test';
import assert from 'node:assert/strict';

import {
  filterArticles,
  getPublishedArticles,
  getSourceDomain,
} from '../reading/library-model.js';

function libraryFixture() {
  return {
    categories: [
      { id: 'game-design', name: '游戏设计' },
      { id: 'interaction-design', name: '交互设计' },
    ],
    tags: [
      { id: 'level-design', name: '关卡设计' },
      { id: 'onboarding', name: '新手引导' },
      { id: 'research', name: '用户研究' },
    ],
    articles: [
      {
        id: 'draft', title: '未发布文章', recommendation: '不可见',
        categoryId: 'game-design', tagIds: [], status: 'draft',
        publishedAt: null, url: 'https://draft.example.com',
      },
      {
        id: 'older', title: '关卡节奏', recommendation: '拆解游戏体验中的节奏',
        categoryId: 'game-design', tagIds: ['level-design'], status: 'published',
        publishedAt: '2026-07-20T00:00:00.000Z', url: 'https://design.example.com/level',
      },
      {
        id: 'newer', title: '引导研究', recommendation: '适合设计新手流程',
        categoryId: 'interaction-design', tagIds: ['onboarding', 'research'], status: 'published',
        publishedAt: '2026-07-22T00:00:00.000Z', url: 'https://ux.example.com/guide',
      },
    ],
  };
}

test('returns only published articles ordered newest first without mutation', () => {
  const library = libraryFixture();
  const before = structuredClone(library);
  assert.deepEqual(getPublishedArticles(library).map(({ id }) => id), ['newer', 'older']);
  assert.deepEqual(library, before);
});

test('searches title, recommendation, category, and Tag names', () => {
  const library = libraryFixture();
  for (const query of ['引导研究', '新手流程', '交互设计', '用户研究']) {
    assert.deepEqual(filterArticles(library, {
      query, categoryId: 'all', tagIds: [],
    }).map(({ id }) => id), ['newer']);
  }
});

test('combines category with multiple Tag intersection filtering', () => {
  const library = libraryFixture();
  assert.deepEqual(filterArticles(library, {
    query: '',
    categoryId: 'interaction-design',
    tagIds: ['onboarding', 'research'],
  }).map(({ id }) => id), ['newer']);

  assert.deepEqual(filterArticles(library, {
    query: '',
    categoryId: 'interaction-design',
    tagIds: ['onboarding', 'level-design'],
  }), []);
});

test('does not crash when an article references missing display records', () => {
  const library = libraryFixture();
  library.articles[1].categoryId = 'missing';
  library.articles[1].tagIds = ['missing'];

  assert.deepEqual(filterArticles(library, {
    query: 'anything', categoryId: 'all', tagIds: [],
  }), []);
});

test('extracts source domains and handles invalid URLs', () => {
  assert.equal(getSourceDomain('https://www.example.com/path'), 'example.com');
  assert.equal(getSourceDomain('not a url'), '');
});
