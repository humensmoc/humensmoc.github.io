function normalized(value) {
  return String(value ?? '').trim().toLocaleLowerCase();
}

export function getLibraryStats(library) {
  return {
    total: library.articles.length,
    drafts: library.articles.filter(({ status }) => status === 'draft').length,
    published: library.articles.filter(({ status }) => status === 'published').length,
  };
}

export function filterManagedArticles(library, filters) {
  const query = normalized(filters.query);
  return library.articles
    .filter((article) => !query || normalized(article.title).includes(query))
    .filter((article) => filters.status === 'all' || article.status === filters.status)
    .filter((article) => filters.categoryId === 'all' || article.categoryId === filters.categoryId)
    .filter((article) => filters.tagId === 'all' || article.tagIds.includes(filters.tagId))
    .toSorted((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
}

export function countCategoryArticles(library, categoryId) {
  return library.articles.filter((article) => article.categoryId === categoryId).length;
}

export function countTagArticles(library, tagId) {
  return library.articles.filter((article) => article.tagIds.includes(tagId)).length;
}
