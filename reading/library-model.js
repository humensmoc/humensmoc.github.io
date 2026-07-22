function normalized(value) {
  return String(value ?? '').trim().toLocaleLowerCase();
}

export function getPublishedArticles(library) {
  return library.articles
    .filter(({ status }) => status === 'published')
    .toSorted((left, right) => String(right.publishedAt).localeCompare(String(left.publishedAt)));
}

export function filterArticles(library, filters) {
  const categoryNames = new Map(library.categories.map(({ id, name }) => [id, name]));
  const tagNames = new Map(library.tags.map(({ id, name }) => [id, name]));
  const query = normalized(filters.query);
  const selectedTagIds = Array.isArray(filters.tagIds) ? filters.tagIds : [];

  return getPublishedArticles(library)
    .filter((article) => !filters.categoryId
      || filters.categoryId === 'all'
      || article.categoryId === filters.categoryId)
    .filter((article) => selectedTagIds.every((tagId) => article.tagIds.includes(tagId)))
    .filter((article) => {
      if (!query) return true;
      const searchableText = [
        article.title,
        article.recommendation,
        categoryNames.get(article.categoryId),
        ...article.tagIds.map((tagId) => tagNames.get(tagId)),
      ].map(normalized).join(' ');
      return searchableText.includes(query);
    });
}

export function getSourceDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}
