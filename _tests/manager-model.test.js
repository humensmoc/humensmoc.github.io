import test from 'node:test';
import assert from 'node:assert/strict';

import {
  countCategoryArticles,
  countTagArticles,
  filterManagedArticles,
  getLibraryStats,
} from '../_tools/article-manager/manager-model.js';

const library = {
  categories: [
    { id: 'game-design', name: '游戏设计' },
    { id: 'interaction-design', name: '交互设计' },
  ],
  tags: [
    { id: 'level-design', name: '关卡设计' },
    { id: 'onboarding', name: '新手引导' },
  ],
  articles: [
    {
      id: 'draft-article',
      title: '关卡节奏分析',
      recommendation: '草稿',
      categoryId: 'game-design',
      tagIds: ['level-design'],
      status: 'draft',
      updatedAt: '2026-07-22T02:00:00.000Z',
    },
    {
      id: 'published-article',
      title: '新手引导原则',
      recommendation: '已发布',
      categoryId: 'interaction-design',
      tagIds: ['onboarding'],
      status: 'published',
      updatedAt: '2026-07-22T03:00:00.000Z',
    },
  ],
};

test('reports draft and published counts', () => {
  assert.deepEqual(getLibraryStats(library), { total: 2, drafts: 1, published: 1 });
});

test('filters managed articles by combined criteria and newest update first', () => {
  assert.deepEqual(filterManagedArticles(library, {
    query: '引导',
    status: 'published',
    categoryId: 'interaction-design',
    tagId: 'onboarding',
  }).map(({ id }) => id), ['published-article']);

  assert.deepEqual(filterManagedArticles(library, {
    query: '', status: 'all', categoryId: 'all', tagId: 'all',
  }).map(({ id }) => id), ['published-article', 'draft-article']);
});

test('counts category and Tag references', () => {
  assert.equal(countCategoryArticles(library, 'game-design'), 1);
  assert.equal(countCategoryArticles(library, 'missing'), 0);
  assert.equal(countTagArticles(library, 'onboarding'), 1);
  assert.equal(countTagArticles(library, 'missing'), 0);
});
