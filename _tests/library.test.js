import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addCategory,
  addTag,
  createArticle,
  deleteArticle,
  deleteCategory,
  deleteTag,
  mergeTags,
  publishArticle,
  renameCategory,
  renameTag,
  replaceAndDeleteCategory,
  unpublishArticle,
  updateArticle,
  validateLibrary,
} from '../_tools/article-manager/library.js';

function validLibrary() {
  return {
    meta: {
      schemaVersion: 1,
      updatedAt: '2026-07-22T00:00:00.000Z',
    },
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
        id: 'article-1',
        url: 'https://example.com/article',
        title: '文章标题',
        recommendation: '推荐理由',
        categoryId: 'game-design',
        tagIds: ['level-design'],
        status: 'draft',
        createdAt: '2026-07-22T00:00:00.000Z',
        updatedAt: '2026-07-22T00:00:00.000Z',
        publishedAt: null,
      },
    ],
  };
}

test('accepts a valid library', () => {
  assert.deepEqual(validateLibrary(validLibrary()), []);
});

test('rejects missing required article text', () => {
  const library = validLibrary();
  library.articles[0].title = '   ';

  assert.match(validateLibrary(library).join('\n'), /标题不能为空/);
});

test('rejects duplicate article URLs', () => {
  const library = validLibrary();
  library.articles.push({ ...library.articles[0], id: 'article-2' });

  assert.match(validateLibrary(library).join('\n'), /链接已存在/);
});

test('rejects unsupported URL protocols', () => {
  const library = validLibrary();
  library.articles[0].url = 'javascript:alert(1)';

  assert.match(validateLibrary(library).join('\n'), /只支持 http 或 https/);
});

test('rejects missing category references', () => {
  const library = validLibrary();
  library.articles[0].categoryId = 'missing';

  assert.match(validateLibrary(library).join('\n'), /主分类不存在/);
});

test('rejects missing Tag references', () => {
  const library = validLibrary();
  library.articles[0].tagIds = ['missing'];

  assert.match(validateLibrary(library).join('\n'), /Tag 不存在/);
});

test('rejects duplicate Tag references on an article', () => {
  const library = validLibrary();
  library.articles[0].tagIds = ['level-design', 'level-design'];

  assert.match(validateLibrary(library).join('\n'), /包含重复 Tag/);
});

test('rejects case-insensitive duplicate category names', () => {
  const library = validLibrary();
  library.categories.push({ id: 'game-design-copy', name: ' GAME DESIGN ' });
  library.categories[0].name = 'Game Design';

  assert.match(validateLibrary(library).join('\n'), /主分类名称重复/);
});

test('rejects case-insensitive duplicate Tag names', () => {
  const library = validLibrary();
  library.tags.push({ id: 'level-design-copy', name: ' LEVEL DESIGN ' });
  library.tags[0].name = 'Level Design';

  assert.match(validateLibrary(library).join('\n'), /Tag 名称重复/);
});

test('requires publication time for published articles', () => {
  const library = validLibrary();
  library.articles[0].status = 'published';

  assert.match(validateLibrary(library).join('\n'), /已发布文章缺少发布时间/);
});

test('rejects unknown publication states', () => {
  const library = validLibrary();
  library.articles[0].status = 'archived';

  assert.match(validateLibrary(library).join('\n'), /状态无效/);
});

test('rejects malformed top-level data', () => {
  assert.match(validateLibrary(null).join('\n'), /数据必须是对象/);
  assert.match(validateLibrary({}).join('\n'), /categories 必须是数组/);
});

test('creates a normalized draft without mutating the library', () => {
  const library = validLibrary();
  const before = structuredClone(library);
  const next = createArticle(library, {
    url: ' https://example.com/new ',
    title: ' 新文章 ',
    recommendation: ' 推荐内容 ',
    categoryId: 'interaction-design',
    tagIds: ['onboarding'],
  }, { id: 'article-2', now: '2026-07-22T01:00:00.000Z' });

  assert.deepEqual(library, before);
  assert.equal(next.articles[1].title, '新文章');
  assert.equal(next.articles[1].status, 'draft');
  assert.equal(next.articles[1].publishedAt, null);
});

test('updates article content while preserving managed fields', () => {
  const next = updateArticle(validLibrary(), 'article-1', {
    url: 'https://example.com/changed',
    title: ' 修改后 ',
    recommendation: ' 新理由 ',
    categoryId: 'interaction-design',
    tagIds: ['onboarding'],
  }, { now: '2026-07-22T01:00:00.000Z' });

  assert.equal(next.articles[0].title, '修改后');
  assert.equal(next.articles[0].createdAt, '2026-07-22T00:00:00.000Z');
  assert.equal(next.articles[0].updatedAt, '2026-07-22T01:00:00.000Z');
});

test('rejects a duplicate link when creating an article', () => {
  assert.throws(() => createArticle(validLibrary(), {
    url: 'https://example.com/article',
    title: '重复文章',
    recommendation: '重复链接',
    categoryId: 'game-design',
    tagIds: [],
  }, { id: 'article-2', now: '2026-07-22T01:00:00.000Z' }), /链接已存在/);
});

test('publishes, withdraws, and republishes with the first publication time', () => {
  const published = publishArticle(validLibrary(), 'article-1', {
    now: '2026-07-22T01:00:00.000Z',
  });
  const withdrawn = unpublishArticle(published, 'article-1', {
    now: '2026-07-22T02:00:00.000Z',
  });
  const republished = publishArticle(withdrawn, 'article-1', {
    now: '2026-07-22T03:00:00.000Z',
  });

  assert.equal(published.articles[0].status, 'published');
  assert.equal(withdrawn.articles[0].status, 'draft');
  assert.equal(republished.articles[0].publishedAt, '2026-07-22T01:00:00.000Z');
});

test('deletes an article', () => {
  const next = deleteArticle(validLibrary(), 'article-1', {
    now: '2026-07-22T01:00:00.000Z',
  });

  assert.equal(next.articles.length, 0);
});

test('adds and renames a category with normalized names', () => {
  const added = addCategory(validLibrary(), ' 视觉设计 ', {
    id: 'visual-design',
    now: '2026-07-22T01:00:00.000Z',
  });
  const renamed = renameCategory(added, 'visual-design', ' 平面设计 ', {
    now: '2026-07-22T02:00:00.000Z',
  });

  assert.equal(renamed.categories.at(-1).name, '平面设计');
});

test('rejects duplicate category names', () => {
  assert.throws(() => addCategory(validLibrary(), ' 游戏设计 ', {
    id: 'duplicate',
    now: '2026-07-22T01:00:00.000Z',
  }), /主分类名称重复/);
});

test('only deletes unused categories and retains at least one', () => {
  const library = validLibrary();
  assert.throws(() => deleteCategory(library, 'game-design', {
    now: '2026-07-22T01:00:00.000Z',
  }), /仍被文章使用/);

  const withoutUnused = deleteCategory(library, 'interaction-design', {
    now: '2026-07-22T01:00:00.000Z',
  });
  assert.equal(withoutUnused.categories.length, 1);
  assert.throws(() => deleteCategory(withoutUnused, 'game-design', {
    now: '2026-07-22T02:00:00.000Z',
  }), /至少保留一个主分类/);
});

test('replaces an in-use category before deleting it', () => {
  const next = replaceAndDeleteCategory(validLibrary(), 'game-design', 'interaction-design', {
    now: '2026-07-22T01:00:00.000Z',
  });

  assert.equal(next.categories.some(({ id }) => id === 'game-design'), false);
  assert.equal(next.articles[0].categoryId, 'interaction-design');
});

test('adds and renames a Tag and rejects duplicate names', () => {
  const added = addTag(validLibrary(), ' 信息架构 ', {
    id: 'information-architecture',
    now: '2026-07-22T01:00:00.000Z',
  });
  const renamed = renameTag(added, 'information-architecture', ' 内容架构 ', {
    now: '2026-07-22T02:00:00.000Z',
  });

  assert.equal(renamed.tags.at(-1).name, '内容架构');
  assert.throws(() => addTag(renamed, '关卡设计', {
    id: 'duplicate',
    now: '2026-07-22T03:00:00.000Z',
  }), /Tag 名称重复/);
});

test('merges Tags and de-duplicates article references', () => {
  const library = validLibrary();
  library.articles[0].tagIds = ['level-design', 'onboarding'];
  const next = mergeTags(library, 'level-design', 'onboarding', {
    now: '2026-07-22T01:00:00.000Z',
  });

  assert.deepEqual(next.articles[0].tagIds, ['onboarding']);
  assert.equal(next.tags.some(({ id }) => id === 'level-design'), false);
});

test('deletes a Tag and removes all article references', () => {
  const next = deleteTag(validLibrary(), 'level-design', {
    now: '2026-07-22T01:00:00.000Z',
  });

  assert.deepEqual(next.articles[0].tagIds, []);
  assert.equal(next.tags.some(({ id }) => id === 'level-design'), false);
});
