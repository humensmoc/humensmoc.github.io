import {
  addCategory,
  addTag,
  createArticle,
  deleteArticle,
  deleteCategory,
  deleteTag,
  publishArticle,
  renameCategory,
  renameTag,
  replaceAndDeleteCategory,
  unpublishArticle,
  updateArticle,
} from './library.js';
import {
  countCategoryArticles,
  countTagArticles,
  filterManagedArticles,
  getLibraryStats,
} from './manager-model.js';

const elements = {
  totalCount: document.querySelector('#total-count'),
  draftCount: document.querySelector('#draft-count'),
  publishedCount: document.querySelector('#published-count'),
  updatedAt: document.querySelector('#updated-at'),
  dirtyIndicator: document.querySelector('#dirty-indicator'),
  statusMessage: document.querySelector('#status-message'),
  errorMessage: document.querySelector('#error-message'),
  articleSearch: document.querySelector('#article-search'),
  statusFilter: document.querySelector('#status-filter'),
  categoryFilter: document.querySelector('#category-filter'),
  tagFilter: document.querySelector('#tag-filter'),
  articleResultCount: document.querySelector('#article-result-count'),
  articleList: document.querySelector('#article-list'),
  newArticle: document.querySelector('#new-article'),
  articleForm: document.querySelector('#article-form'),
  editorState: document.querySelector('#editor-state'),
  editorTitle: document.querySelector('#editor-title'),
  articleStatus: document.querySelector('#article-status'),
  publishToggle: document.querySelector('#publish-toggle'),
  deleteArticle: document.querySelector('#delete-article'),
  categoryPicker: document.querySelector('#category-picker'),
  tagPicker: document.querySelector('#tag-picker'),
};

let library;
let selectedArticleId = null;
let dirty = false;

function now() {
  return new Date().toISOString();
}

function announce(message, error = false) {
  elements.statusMessage.textContent = error ? '' : message;
  elements.errorMessage.textContent = error ? message : '';
  elements.errorMessage.hidden = !error;
}

function setDirty(value) {
  dirty = value;
  elements.dirtyIndicator.hidden = !value;
}

function confirmDiscard() {
  return !dirty || window.confirm('当前文章有未保存修改，确定要放弃吗？');
}

function option(value, text) {
  const item = document.createElement('option');
  item.value = value;
  item.textContent = text;
  return item;
}

function selectedArticle() {
  return library?.articles.find(({ id }) => id === selectedArticleId) ?? null;
}

function renderStats() {
  const stats = getLibraryStats(library);
  elements.totalCount.textContent = stats.total;
  elements.draftCount.textContent = stats.drafts;
  elements.publishedCount.textContent = stats.published;
  elements.updatedAt.textContent = new Date(library.meta.updatedAt).toLocaleString('zh-CN');
}

function renderFilterOptions() {
  const categoryValue = elements.categoryFilter.value || 'all';
  elements.categoryFilter.replaceChildren(option('all', '全部'));
  for (const category of library.categories) {
    elements.categoryFilter.append(option(category.id, category.name));
  }
  elements.categoryFilter.value = library.categories.some(({ id }) => id === categoryValue) ? categoryValue : 'all';

  const tagValue = elements.tagFilter.value || 'all';
  elements.tagFilter.replaceChildren(option('all', '全部'));
  for (const tag of library.tags) elements.tagFilter.append(option(tag.id, tag.name));
  elements.tagFilter.value = library.tags.some(({ id }) => id === tagValue) ? tagValue : 'all';
}

function renderArticleList() {
  const articles = filterManagedArticles(library, {
    query: elements.articleSearch.value,
    status: elements.statusFilter.value,
    categoryId: elements.categoryFilter.value,
    tagId: elements.tagFilter.value,
  });
  elements.articleResultCount.textContent = `${articles.length} 篇文章`;
  elements.articleList.replaceChildren();

  if (!articles.length) {
    const empty = document.createElement('p');
    empty.className = 'tag-empty';
    empty.textContent = '没有符合条件的文章。';
    elements.articleList.append(empty);
    return;
  }

  for (const article of articles) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `article-row${article.id === selectedArticleId ? ' selected' : ''}`;
    const title = document.createElement('span');
    title.className = 'article-row-title';
    title.textContent = article.title;
    const category = library.categories.find(({ id }) => id === article.categoryId)?.name ?? '未知分类';
    const meta = document.createElement('span');
    meta.className = 'article-row-meta';
    meta.textContent = `${article.status === 'published' ? '已发布' : '草稿'} · ${category}`;
    button.append(title, meta);
    button.addEventListener('click', () => {
      if (!confirmDiscard()) return;
      selectedArticleId = article.id;
      renderArticleForm();
      renderArticleList();
    });
    elements.articleList.append(button);
  }
}

function getSelectedTagIds() {
  return [...elements.tagPicker.querySelectorAll('input[name="tagIds"]:checked')].map(({ value }) => value);
}

function updateTaxonomySummary(kind) {
  const picker = kind === 'category' ? elements.categoryPicker : elements.tagPicker;
  const summary = picker.querySelector(kind === 'category' ? '#category-summary' : '#tag-summary');
  if (kind === 'category') {
    const selectedId = elements.articleForm.elements.categoryId.value;
    summary.textContent = library.categories.find(({ id }) => id === selectedId)?.name ?? '请选择主分类';
    return;
  }
  const selectedNames = getSelectedTagIds()
    .map((id) => library.tags.find((tag) => tag.id === id)?.name)
    .filter(Boolean);
  summary.textContent = selectedNames.length ? selectedNames.join('、') : '未选择 Tag';
}

function taxonomyConfig(kind) {
  return kind === 'category'
    ? {
        picker: elements.categoryPicker,
        records: library.categories,
        count: countCategoryArticles,
        label: '分类',
      }
    : {
        picker: elements.tagPicker,
        records: library.tags,
        count: countTagArticles,
        label: 'Tag',
      };
}

function renderTaxonomyPicker(kind, selectedIds) {
  const config = taxonomyConfig(kind);
  const list = config.picker.querySelector('.taxonomy-list');
  const editor = config.picker.querySelector('.taxonomy-editor');
  const query = config.picker.querySelector('.taxonomy-search').value.trim().toLocaleLowerCase();
  const visibleRecords = config.records.filter(({ name }) => !query
    || name.toLocaleLowerCase().includes(query));
  list.replaceChildren();
  editor.replaceChildren();
  editor.hidden = true;

  if (!visibleRecords.length) {
    const empty = document.createElement('p');
    empty.className = 'tag-empty';
    const separator = kind === 'tag' ? ' ' : '';
    empty.textContent = config.records.length
      ? `没有匹配的${separator}${config.label}。`
      : `还没有${separator}${config.label}，可在上方直接添加。`;
    list.append(empty);
    updateTaxonomySummary(kind);
    return;
  }

  for (const record of visibleRecords) {
    const labelSeparator = kind === 'tag' ? ' ' : '';
    const row = document.createElement('div');
    row.className = 'taxonomy-chip';
    row.tabIndex = 0;
    row.title = `左键选择，右键管理${labelSeparator}${config.label}`;

    const choice = document.createElement('label');
    choice.className = 'taxonomy-choice';
    const selection = document.createElement('input');
    selection.type = kind === 'category' ? 'radio' : 'checkbox';
    selection.name = kind === 'category' ? 'category-choice' : 'tagIds';
    selection.value = record.id;
    selection.checked = selectedIds.includes(record.id);
    selection.addEventListener('change', () => {
      if (kind === 'category') elements.articleForm.elements.categoryId.value = record.id;
      updateTaxonomySummary(kind);
      setDirty(true);
    });
    const selectionText = document.createElement('span');
    selectionText.textContent = record.name;

    const meta = document.createElement('span');
    meta.className = 'management-meta';
    meta.textContent = config.count(library, record.id);
    meta.setAttribute('aria-label', `${config.count(library, record.id)} 篇文章`);
    choice.append(selection, selectionText, meta);
    row.append(choice);
    const openEditor = (event) => {
      event.preventDefault();
      renderTaxonomyEditor(kind, record);
    };
    row.addEventListener('contextmenu', openEditor);
    row.addEventListener('keydown', (event) => {
      if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) openEditor(event);
    });
    list.append(row);
  }
  updateTaxonomySummary(kind);
}

function renderTaxonomyEditor(kind, record) {
  const config = taxonomyConfig(kind);
  const editor = config.picker.querySelector('.taxonomy-editor');
  editor.replaceChildren();
  editor.hidden = false;

  const heading = document.createElement('span');
  heading.className = 'taxonomy-editor-title';
  heading.textContent = `编辑${kind === 'tag' ? ' ' : ''}${config.label}“${record.name}”`;
  const input = document.createElement('input');
  input.className = 'taxonomy-name-input';
  input.value = record.name;
  input.setAttribute('aria-label', `${config.label}名称`);
  const actions = document.createElement('div');
  actions.className = 'taxonomy-actions';
  actions.append(
    makeManagementButton('保存更改', 'secondary compact', async () => {
      const selected = kind === 'category'
        ? [elements.articleForm.elements.categoryId.value]
        : getSelectedTagIds();
      const next = kind === 'category'
        ? renameCategory(library, record.id, input.value, { now: now() })
        : renameTag(library, record.id, input.value, { now: now() });
      await persist(next, `${config.label}名称已保存`, { preserveDirty: true });
      renderTaxonomyPicker(kind, selected);
    }),
    makeManagementButton('删除', 'danger compact', async () => {
      await deleteTaxonomyRecord(kind, record);
    }),
  );
  editor.append(heading, input, actions);
  input.focus();
  input.select();
}

async function deleteTaxonomyRecord(kind, record) {
  const selectedTags = getSelectedTagIds();
  if (kind === 'category') {
    const count = countCategoryArticles(library, record.id);
    let next;
    let nextCategoryId = elements.articleForm.elements.categoryId.value;
    if (count === 0) {
      if (!window.confirm(`确定删除主分类“${record.name}”吗？`)) return;
      next = deleteCategory(library, record.id, { now: now() });
      if (nextCategoryId === record.id) nextCategoryId = next.categories[0]?.id ?? '';
    } else {
      const choices = library.categories.filter(({ id }) => id !== record.id).map(({ name }) => name).join('、');
      const replacementName = window.prompt(`该分类仍被 ${count} 篇文章使用。请输入替代分类名称：\n${choices}`);
      if (!replacementName) return;
      const replacement = library.categories.find(({ id, name }) => id !== record.id
        && name.toLocaleLowerCase() === replacementName.trim().toLocaleLowerCase());
      if (!replacement) throw new Error('没有找到这个替代分类');
      if (!window.confirm(`将 ${count} 篇文章迁移到“${replacement.name}”并删除“${record.name}”？`)) return;
      next = replaceAndDeleteCategory(library, record.id, replacement.id, { now: now() });
      if (nextCategoryId === record.id) nextCategoryId = replacement.id;
    }
    await persist(next, '主分类已删除', { preserveDirty: true });
    elements.articleForm.elements.categoryId.value = nextCategoryId;
    renderTaxonomyPicker('category', [nextCategoryId]);
    return;
  }

  const count = countTagArticles(library, record.id);
  if (count === 0) {
    if (!window.confirm(`确定删除 Tag“${record.name}”吗？`)) return;
  } else {
    const typed = window.prompt(`删除后将从 ${count} 篇文章移除此 Tag。请输入“${record.name}”确认：`);
    if (typed !== record.name) throw new Error('输入的 Tag 名称不一致，已取消删除');
  }
  await persist(deleteTag(library, record.id, { now: now() }), 'Tag 已删除', { preserveDirty: true });
  renderTaxonomyPicker('tag', selectedTags.filter((id) => id !== record.id));
}

function renderArticleForm() {
  const article = selectedArticle();
  elements.articleForm.reset();
  elements.editorState.textContent = article ? 'EDIT ARTICLE' : 'NEW DRAFT';
  elements.editorTitle.textContent = article?.title || '新建文章';
  elements.articleStatus.textContent = article?.status === 'published' ? '已发布' : '草稿';
  elements.articleStatus.className = `status-chip ${article?.status === 'published' ? 'published' : 'draft'}`;
  elements.publishToggle.textContent = article?.status === 'published' ? '撤回为草稿' : '发布';
  elements.deleteArticle.disabled = !article;

  const categoryInput = elements.articleForm.elements.categoryId;
  if (article) {
    elements.articleForm.elements.url.value = article.url;
    elements.articleForm.elements.title.value = article.title;
    elements.articleForm.elements.recommendation.value = article.recommendation;
    categoryInput.value = article.categoryId;
  } else {
    categoryInput.value = library.categories[0]?.id ?? '';
  }
  for (const picker of [elements.categoryPicker, elements.tagPicker]) {
    picker.querySelector('.taxonomy-search').value = '';
  }
  renderTaxonomyPicker('category', [categoryInput.value]);
  renderTaxonomyPicker('tag', article?.tagIds ?? []);
  setDirty(false);
}

function renderOverview() {
  renderStats();
  renderFilterOptions();
  renderArticleList();
}

function articleInput() {
  const data = new FormData(elements.articleForm);
  return {
    url: data.get('url'),
    title: data.get('title'),
    recommendation: data.get('recommendation'),
    categoryId: data.get('categoryId'),
    tagIds: data.getAll('tagIds'),
  };
}

async function persist(nextLibrary, message = '保存成功', { preserveDirty = false } = {}) {
  const wasDirty = dirty;
  const response = await fetch('/api/library', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nextLibrary),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '保存失败');
  library = result;
  setDirty(preserveDirty && wasDirty);
  renderOverview();
  announce(message);
  return result;
}

function handleAction(action) {
  return async (...args) => {
    try {
      await action(...args);
    } catch (error) {
      announce(error.message || '操作失败', true);
    }
  };
}

async function saveCurrent() {
  const timestamp = now();
  if (selectedArticleId) {
    await persist(updateArticle(library, selectedArticleId, articleInput(), { now: timestamp }));
  } else {
    const id = crypto.randomUUID();
    await persist(createArticle(library, articleInput(), { id, now: timestamp }));
    selectedArticleId = id;
  }
  renderArticleForm();
  renderArticleList();
  return selectedArticleId;
}

function makeManagementButton(text, className, action) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `button ${className}`;
  button.textContent = text;
  button.addEventListener('click', handleAction(action));
  return button;
}

function markArticleContentDirty(event) {
  if (event.target.matches('[name="url"], [name="title"], [name="recommendation"]')) setDirty(true);
}

elements.articleForm.addEventListener('input', markArticleContentDirty);
elements.articleForm.addEventListener('change', markArticleContentDirty);
elements.articleForm.addEventListener('submit', handleAction(async (event) => {
  event.preventDefault();
  await saveCurrent();
}));

elements.newArticle.addEventListener('click', () => {
  if (!confirmDiscard()) return;
  selectedArticleId = null;
  renderArticleForm();
  renderArticleList();
  elements.articleForm.elements.url.focus();
});

elements.publishToggle.addEventListener('click', handleAction(async () => {
  if (!selectedArticleId || dirty) await saveCurrent();
  const article = selectedArticle();
  const next = article.status === 'published'
    ? unpublishArticle(library, article.id, { now: now() })
    : publishArticle(library, article.id, { now: now() });
  await persist(next, article.status === 'published' ? '文章已撤回为草稿' : '文章已发布');
  renderArticleForm();
}));

elements.deleteArticle.addEventListener('click', handleAction(async () => {
  const article = selectedArticle();
  if (!article || !window.confirm(`确定删除文章“${article.title}”吗？`)) return;
  await persist(deleteArticle(library, article.id, { now: now() }), '文章已删除');
  selectedArticleId = null;
  renderArticleForm();
}));

for (const filter of [elements.articleSearch, elements.statusFilter, elements.categoryFilter, elements.tagFilter]) {
  filter.addEventListener('input', renderArticleList);
  filter.addEventListener('change', renderArticleList);
}

for (const kind of ['category', 'tag']) {
  const picker = kind === 'category' ? elements.categoryPicker : elements.tagPicker;
  const trigger = picker.querySelector('.taxonomy-trigger');
  const dropdown = picker.querySelector('.taxonomy-dropdown');
  const search = picker.querySelector('.taxonomy-search');
  const addForm = picker.querySelector('.taxonomy-add-form');

  trigger.addEventListener('click', () => {
    const willOpen = dropdown.hidden;
    for (const otherPicker of [elements.categoryPicker, elements.tagPicker]) {
      const otherDropdown = otherPicker.querySelector('.taxonomy-dropdown');
      otherDropdown.hidden = true;
      otherPicker.querySelector('.taxonomy-trigger').setAttribute('aria-expanded', 'false');
    }
    dropdown.hidden = !willOpen;
    trigger.setAttribute('aria-expanded', String(willOpen));
    if (willOpen) search.focus();
  });

  search.addEventListener('input', () => {
    const selected = kind === 'category'
      ? [elements.articleForm.elements.categoryId.value]
      : getSelectedTagIds();
    renderTaxonomyPicker(kind, selected);
  });

  const addRecord = handleAction(async () => {
    const nameInput = addForm.querySelector('[name="name"]');
    const name = nameInput.value;
    const id = crypto.randomUUID();
    const selected = kind === 'category'
      ? [id]
      : [...getSelectedTagIds(), id];
    const next = kind === 'category'
      ? addCategory(library, name, { id, now: now() })
      : addTag(library, name, { id, now: now() });
    await persist(next, `${kind === 'category' ? '主分类' : 'Tag'}已添加`, { preserveDirty: true });
    nameInput.value = '';
    search.value = '';
    if (kind === 'category') elements.articleForm.elements.categoryId.value = id;
    renderTaxonomyPicker(kind, selected);
    setDirty(true);
  });
  addForm.querySelector('button').addEventListener('click', addRecord);
  addForm.querySelector('[name="name"]').addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addRecord();
  });
}

document.addEventListener('click', (event) => {
  for (const picker of [elements.categoryPicker, elements.tagPicker]) {
    if (picker.contains(event.target)) continue;
    picker.querySelector('.taxonomy-dropdown').hidden = true;
    picker.querySelector('.taxonomy-trigger').setAttribute('aria-expanded', 'false');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  for (const picker of [elements.categoryPicker, elements.tagPicker]) {
    picker.querySelector('.taxonomy-dropdown').hidden = true;
    picker.querySelector('.taxonomy-trigger').setAttribute('aria-expanded', 'false');
  }
});

window.addEventListener('beforeunload', (event) => {
  if (!dirty) return;
  event.preventDefault();
  event.returnValue = '';
});

async function initialize() {
  try {
    const response = await fetch('/api/library', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '数据加载失败');
    library = result;
    selectedArticleId = library.articles[0]?.id ?? null;
    renderOverview();
    renderArticleForm();
    announce('数据已加载');
  } catch (error) {
    announce(error.message || '数据加载失败', true);
    elements.articleForm.querySelectorAll('input, textarea, select, button').forEach((element) => {
      element.disabled = true;
    });
  }
}

initialize();
