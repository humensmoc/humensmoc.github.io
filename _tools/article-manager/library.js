export function normalizeName(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isTimestamp(value) {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function duplicateValues(items, getValue) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of items) {
    const value = getValue(item);
    if (!value) continue;
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return duplicates;
}

function validateNamedRecords(records, label, errors) {
  const ids = new Set();
  for (const record of records) {
    if (!isObject(record)) {
      errors.push(`${label}记录必须是对象`);
      continue;
    }

    const id = normalizeName(record.id);
    const name = normalizeName(record.name);
    if (!id) errors.push(`${label} ID 不能为空`);
    if (!name) errors.push(`${label}名称不能为空`);
    if (id && ids.has(id)) errors.push(`${label} ID 重复：${id}`);
    if (id) ids.add(id);
  }

  const duplicatedNames = duplicateValues(
    records.filter(isObject),
    (record) => normalizeName(record.name).toLocaleLowerCase(),
  );
  if (duplicatedNames.size) errors.push(`${label}名称重复`);
}

function validateUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateLibrary(library) {
  const errors = [];
  if (!isObject(library)) return ['数据必须是对象'];

  if (!isObject(library.meta)) {
    errors.push('meta 必须是对象');
  } else {
    if (library.meta.schemaVersion !== 1) errors.push('schemaVersion 必须是 1');
    if (!isTimestamp(library.meta.updatedAt)) errors.push('updatedAt 必须是有效时间');
  }

  if (!Array.isArray(library.categories)) errors.push('categories 必须是数组');
  if (!Array.isArray(library.tags)) errors.push('tags 必须是数组');
  if (!Array.isArray(library.articles)) errors.push('articles 必须是数组');
  if (errors.length) return errors;

  if (library.categories.length === 0) errors.push('至少需要一个主分类');
  validateNamedRecords(library.categories, '主分类', errors);
  validateNamedRecords(library.tags, 'Tag ', errors);

  const categoryIds = new Set(library.categories.map((category) => category.id));
  const tagIds = new Set(library.tags.map((tag) => tag.id));
  const articleIds = new Set();
  const articleUrls = new Set();

  for (const article of library.articles) {
    if (!isObject(article)) {
      errors.push('文章记录必须是对象');
      continue;
    }

    const id = normalizeName(article.id);
    const url = normalizeName(article.url);
    if (!id) errors.push('文章 ID 不能为空');
    if (id && articleIds.has(id)) errors.push(`文章 ID 重复：${id}`);
    if (id) articleIds.add(id);

    if (!url) {
      errors.push('文章链接不能为空');
    } else {
      if (!validateUrl(url)) errors.push(`文章 ${id || '(未知)'} 的链接只支持 http 或 https`);
      if (articleUrls.has(url)) errors.push(`文章链接已存在：${url}`);
      articleUrls.add(url);
    }

    if (!normalizeName(article.title)) errors.push(`文章 ${id || '(未知)'} 的标题不能为空`);
    if (!normalizeName(article.recommendation)) errors.push(`文章 ${id || '(未知)'} 的推荐理由不能为空`);
    if (!categoryIds.has(article.categoryId)) errors.push(`文章 ${id || '(未知)'} 的主分类不存在`);

    if (!Array.isArray(article.tagIds)) {
      errors.push(`文章 ${id || '(未知)'} 的 tagIds 必须是数组`);
    } else {
      if (new Set(article.tagIds).size !== article.tagIds.length) {
        errors.push(`文章 ${id || '(未知)'} 包含重复 Tag`);
      }
      for (const tagId of article.tagIds) {
        if (!tagIds.has(tagId)) errors.push(`文章 ${id || '(未知)'} 的 Tag 不存在：${tagId}`);
      }
    }

    if (!['draft', 'published'].includes(article.status)) {
      errors.push(`文章 ${id || '(未知)'} 的状态无效`);
    }
    if (!isTimestamp(article.createdAt)) errors.push(`文章 ${id || '(未知)'} 的创建时间无效`);
    if (!isTimestamp(article.updatedAt)) errors.push(`文章 ${id || '(未知)'} 的更新时间无效`);
    if (article.status === 'published' && !isTimestamp(article.publishedAt)) {
      errors.push(`已发布文章缺少发布时间：${id || '(未知)'}`);
    }
    if (article.status === 'draft' && article.publishedAt !== null && !isTimestamp(article.publishedAt)) {
      errors.push(`文章 ${id || '(未知)'} 的发布时间无效`);
    }
  }

  return errors;
}

function cloneLibrary(library) {
  return structuredClone(library);
}

function finalize(library, now) {
  const next = {
    ...library,
    meta: {
      ...library.meta,
      updatedAt: now,
    },
  };
  const errors = validateLibrary(next);
  if (errors.length) throw new Error(errors.join('\n'));
  return next;
}

function findArticle(library, articleId) {
  const article = library.articles.find(({ id }) => id === articleId);
  if (!article) throw new Error(`找不到文章：${articleId}`);
  return article;
}

function normalizeArticleInput(input) {
  return {
    url: normalizeName(input.url),
    title: normalizeName(input.title),
    recommendation: normalizeName(input.recommendation),
    categoryId: normalizeName(input.categoryId),
    tagIds: Array.isArray(input.tagIds) ? [...new Set(input.tagIds)] : [],
  };
}

export function createArticle(library, input, { now, id }) {
  const next = cloneLibrary(library);
  next.articles.push({
    id,
    ...normalizeArticleInput(input),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  });
  return finalize(next, now);
}

export function updateArticle(library, articleId, input, { now }) {
  const next = cloneLibrary(library);
  const article = findArticle(next, articleId);
  Object.assign(article, normalizeArticleInput(input), { updatedAt: now });
  return finalize(next, now);
}

export function publishArticle(library, articleId, { now }) {
  const next = cloneLibrary(library);
  const article = findArticle(next, articleId);
  article.status = 'published';
  article.publishedAt ??= now;
  article.updatedAt = now;
  return finalize(next, now);
}

export function unpublishArticle(library, articleId, { now }) {
  const next = cloneLibrary(library);
  const article = findArticle(next, articleId);
  article.status = 'draft';
  article.updatedAt = now;
  return finalize(next, now);
}

export function deleteArticle(library, articleId, { now }) {
  findArticle(library, articleId);
  const next = cloneLibrary(library);
  next.articles = next.articles.filter(({ id }) => id !== articleId);
  return finalize(next, now);
}

function findCategory(library, categoryId) {
  const category = library.categories.find(({ id }) => id === categoryId);
  if (!category) throw new Error(`找不到主分类：${categoryId}`);
  return category;
}

export function addCategory(library, name, { id, now }) {
  const next = cloneLibrary(library);
  next.categories.push({ id, name: normalizeName(name) });
  return finalize(next, now);
}

export function renameCategory(library, categoryId, name, { now }) {
  const next = cloneLibrary(library);
  findCategory(next, categoryId).name = normalizeName(name);
  return finalize(next, now);
}

export function deleteCategory(library, categoryId, { now }) {
  findCategory(library, categoryId);
  if (library.categories.length === 1) throw new Error('至少保留一个主分类');
  if (library.articles.some((article) => article.categoryId === categoryId)) {
    throw new Error('该主分类仍被文章使用');
  }
  const next = cloneLibrary(library);
  next.categories = next.categories.filter(({ id }) => id !== categoryId);
  return finalize(next, now);
}

export function replaceAndDeleteCategory(library, sourceId, targetId, { now }) {
  if (sourceId === targetId) throw new Error('替代分类不能与待删除分类相同');
  findCategory(library, sourceId);
  findCategory(library, targetId);
  const next = cloneLibrary(library);
  next.articles = next.articles.map((article) => article.categoryId === sourceId
    ? { ...article, categoryId: targetId, updatedAt: now }
    : article);
  next.categories = next.categories.filter(({ id }) => id !== sourceId);
  return finalize(next, now);
}

function findTag(library, tagId) {
  const tag = library.tags.find(({ id }) => id === tagId);
  if (!tag) throw new Error(`找不到 Tag：${tagId}`);
  return tag;
}

export function addTag(library, name, { id, now }) {
  const next = cloneLibrary(library);
  next.tags.push({ id, name: normalizeName(name) });
  return finalize(next, now);
}

export function renameTag(library, tagId, name, { now }) {
  const next = cloneLibrary(library);
  findTag(next, tagId).name = normalizeName(name);
  return finalize(next, now);
}

export function mergeTags(library, sourceId, targetId, { now }) {
  if (sourceId === targetId) throw new Error('目标 Tag 不能与源 Tag 相同');
  findTag(library, sourceId);
  findTag(library, targetId);
  const next = cloneLibrary(library);
  next.articles = next.articles.map((article) => {
    if (!article.tagIds.includes(sourceId)) return article;
    return {
      ...article,
      tagIds: [...new Set(article.tagIds.map((tagId) => tagId === sourceId ? targetId : tagId))],
      updatedAt: now,
    };
  });
  next.tags = next.tags.filter(({ id }) => id !== sourceId);
  return finalize(next, now);
}

export function deleteTag(library, tagId, { now }) {
  findTag(library, tagId);
  const next = cloneLibrary(library);
  next.articles = next.articles.map((article) => article.tagIds.includes(tagId)
    ? { ...article, tagIds: article.tagIds.filter((id) => id !== tagId), updatedAt: now }
    : article);
  next.tags = next.tags.filter(({ id }) => id !== tagId);
  return finalize(next, now);
}
