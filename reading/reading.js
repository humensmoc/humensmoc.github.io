import { filterArticles, getPublishedArticles, getSourceDomain } from './library-model.js';

const elements = {
  publishedTotal: document.querySelector('#published-total'),
  search: document.querySelector('#article-search'),
  clear: document.querySelector('#clear-filters'),
  emptyClear: document.querySelector('#empty-clear'),
  retry: document.querySelector('#retry-load'),
  categoryFilters: document.querySelector('#category-filters'),
  tagFilters: document.querySelector('#tag-filters'),
  selectedTagSummary: document.querySelector('#selected-tag-summary'),
  resultSummary: document.querySelector('#result-summary'),
  articleList: document.querySelector('#article-list'),
  emptyState: document.querySelector('#empty-state'),
  errorState: document.querySelector('#error-state'),
  errorDetail: document.querySelector('#error-detail'),
};

let library;
const filters = {
  query: '',
  categoryId: 'all',
  tagIds: [],
};

function textElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function filterButton(text, pressed, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'filter-button';
  button.textContent = text;
  button.setAttribute('aria-pressed', String(pressed));
  button.addEventListener('click', onClick);
  return button;
}

function formattedDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

function safeArticleUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function renderFilters() {
  elements.categoryFilters.replaceChildren(
    filterButton('全部', filters.categoryId === 'all', () => {
      filters.categoryId = 'all';
      render();
    }),
  );
  for (const category of library.categories) {
    elements.categoryFilters.append(filterButton(
      category.name,
      filters.categoryId === category.id,
      () => {
        filters.categoryId = category.id;
        render();
      },
    ));
  }

  const publishedTagIds = new Set(getPublishedArticles(library).flatMap(({ tagIds }) => tagIds));
  elements.tagFilters.replaceChildren();
  for (const tag of library.tags.filter(({ id }) => publishedTagIds.has(id))) {
    elements.tagFilters.append(filterButton(
      tag.name,
      filters.tagIds.includes(tag.id),
      () => {
        filters.tagIds = filters.tagIds.includes(tag.id)
          ? filters.tagIds.filter((id) => id !== tag.id)
          : [...filters.tagIds, tag.id];
        render();
      },
    ));
  }
  elements.selectedTagSummary.textContent = filters.tagIds.length ? `已选 ${filters.tagIds.length} 个` : '全部';
}

function createArticleCard(article) {
  const category = library.categories.find(({ id }) => id === article.categoryId);
  const card = document.createElement('article');
  card.className = 'article-card';

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  meta.append(
    textElement('span', 'category-name', category?.name ?? '未知分类'),
    textElement('time', '', formattedDate(article.publishedAt)),
  );

  const heading = document.createElement('h3');
  heading.className = 'article-title';
  const titleLink = document.createElement('a');
  const href = safeArticleUrl(article.url);
  titleLink.textContent = article.title;
  if (href) {
    titleLink.href = href;
    titleLink.target = '_blank';
    titleLink.rel = 'noopener noreferrer';
  }
  heading.append(titleLink);

  const recommendation = textElement('p', 'recommendation', article.recommendation);
  const footer = document.createElement('div');
  footer.className = 'card-footer';
  const tags = document.createElement('div');
  tags.className = 'card-tags';
  for (const tagId of article.tagIds) {
    const tag = library.tags.find(({ id }) => id === tagId);
    if (tag) tags.append(textElement('span', 'card-tag', tag.name));
  }
  const source = document.createElement('a');
  source.className = 'source-link';
  source.textContent = `${getSourceDomain(article.url) || '阅读原文'} ↗`;
  if (href) {
    source.href = href;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
  }
  footer.append(tags, source);
  card.append(meta, heading, recommendation, footer);
  return card;
}

function renderResults() {
  const articles = filterArticles(library, filters);
  elements.articleList.replaceChildren(...articles.map(createArticleCard));
  elements.resultSummary.textContent = `找到 ${articles.length} 篇文章`;
  elements.articleList.hidden = articles.length === 0;
  elements.emptyState.hidden = articles.length !== 0;
  elements.errorState.hidden = true;
}

function render() {
  renderFilters();
  renderResults();
}

function clearFilters() {
  filters.query = '';
  filters.categoryId = 'all';
  filters.tagIds = [];
  elements.search.value = '';
  render();
}

async function loadLibrary() {
  elements.resultSummary.textContent = '正在加载……';
  elements.errorState.hidden = true;
  try {
    const response = await fetch('/data/reading-library.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`服务器返回 ${response.status}`);
    library = await response.json();
    elements.search.disabled = false;
    elements.clear.disabled = false;
    elements.publishedTotal.textContent = getPublishedArticles(library).length;
    render();
  } catch (error) {
    elements.articleList.hidden = true;
    elements.emptyState.hidden = true;
    elements.errorState.hidden = false;
    elements.errorDetail.textContent = `无法读取文章数据：${error.message}`;
    elements.resultSummary.textContent = '加载失败';
  }
}

elements.search.addEventListener('input', (event) => {
  filters.query = event.currentTarget.value;
  renderResults();
});
elements.clear.addEventListener('click', clearFilters);
elements.emptyClear.addEventListener('click', clearFilters);
elements.retry.addEventListener('click', loadLibrary);

loadLibrary();
