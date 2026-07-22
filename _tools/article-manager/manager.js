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
  tagSearch: document.querySelector('#tag-search'),
  articleTagOptions: document.querySelector('#article-tag-options'),
  categoryDialog: document.querySelector('#category-dialog'),
  tagDialog: document.querySelector('#tag-dialog'),
  categoryList: document.querySelector('#category-list'),
  tagList: document.querySelector('#tag-list'),
  addCategoryForm: document.querySelector('#add-category-form'),
  addTagForm: document.querySelector('#add-tag-form'),
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

function renderTagOptions(selectedIds = []) {
  const query = elements.tagSearch.value.trim().toLocaleLowerCase();
  elements.articleTagOptions.replaceChildren();
  const tags = library.tags.filter(({ id, name }) => selectedIds.includes(id)
    || name.toLocaleLowerCase().includes(query));
  if (!tags.length) {
    const empty = document.createElement('p');
    empty.className = 'tag-empty';
    empty.textContent = library.tags.length ? '没有匹配的 Tag。' : '还没有 Tag，请先在 Tag 管理中创建。';
    elements.articleTagOptions.append(empty);
    return;
  }
  for (const tag of tags) {
    const label = document.createElement('label');
    label.className = 'tag-option';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'tagIds';
    checkbox.value = tag.id;
    checkbox.checked = selectedIds.includes(tag.id);
    const name = document.createElement('span');
    name.textContent = tag.name;
    label.append(checkbox, name);
    elements.articleTagOptions.append(label);
  }
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

  const categorySelect = elements.articleForm.elements.categoryId;
  categorySelect.replaceChildren();
  for (const category of library.categories) categorySelect.append(option(category.id, category.name));

  if (article) {
    elements.articleForm.elements.url.value = article.url;
    elements.articleForm.elements.title.value = article.title;
    elements.articleForm.elements.recommendation.value = article.recommendation;
    categorySelect.value = article.categoryId;
  }
  elements.tagSearch.value = '';
  renderTagOptions(article?.tagIds ?? []);
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

async function persist(nextLibrary, message = '保存成功') {
  const response = await fetch('/api/library', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nextLibrary),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '保存失败');
  library = result;
  setDirty(false);
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

function renderCategoryManagement() {
  elements.categoryList.replaceChildren();
  for (const category of library.categories) {
    const row = document.createElement('div');
    row.className = 'management-row';
    const field = document.createElement('label');
    field.textContent = `${countCategoryArticles(library, category.id)} 篇文章`;
    const input = document.createElement('input');
    input.value = category.name;
    field.append(input);
    const actions = document.createElement('div');
    actions.className = 'management-actions';
    actions.append(
      makeManagementButton('保存名称', 'secondary', async () => {
        await persist(renameCategory(library, category.id, input.value, { now: now() }), '分类名称已保存');
        renderCategoryManagement();
        renderArticleForm();
      }),
      makeManagementButton('删除', 'danger', async () => {
        const count = countCategoryArticles(library, category.id);
        if (count === 0) {
          if (!window.confirm(`确定删除主分类“${category.name}”吗？`)) return;
          await persist(deleteCategory(library, category.id, { now: now() }), '主分类已删除');
        } else {
          const choices = library.categories.filter(({ id }) => id !== category.id).map(({ name }) => name).join('、');
          const replacementName = window.prompt(`该分类仍被 ${count} 篇文章使用。请输入替代分类名称：\n${choices}`);
          if (!replacementName) return;
          const replacement = library.categories.find(({ id, name }) => id !== category.id
            && name.toLocaleLowerCase() === replacementName.trim().toLocaleLowerCase());
          if (!replacement) throw new Error('没有找到这个替代分类');
          if (!window.confirm(`将 ${count} 篇文章迁移到“${replacement.name}”并删除“${category.name}”？`)) return;
          await persist(replaceAndDeleteCategory(library, category.id, replacement.id, { now: now() }), '文章已迁移，主分类已删除');
        }
        renderCategoryManagement();
        renderArticleForm();
      }),
    );
    row.append(field, actions);
    elements.categoryList.append(row);
  }
}

function renderTagManagement() {
  elements.tagList.replaceChildren();
  if (!library.tags.length) {
    const empty = document.createElement('p');
    empty.className = 'tag-empty';
    empty.textContent = '还没有 Tag。';
    elements.tagList.append(empty);
    return;
  }
  for (const tag of library.tags) {
    const row = document.createElement('div');
    row.className = 'management-row';
    const field = document.createElement('label');
    field.textContent = `${countTagArticles(library, tag.id)} 篇文章`;
    const input = document.createElement('input');
    input.value = tag.name;
    field.append(input);
    const actions = document.createElement('div');
    actions.className = 'management-actions';
    const mergeSelect = document.createElement('select');
    mergeSelect.className = 'merge-select';
    mergeSelect.append(option('', '合并到…'));
    for (const target of library.tags.filter(({ id }) => id !== tag.id)) {
      mergeSelect.append(option(target.id, target.name));
    }
    actions.append(
      makeManagementButton('保存名称', 'secondary', async () => {
        await persist(renameTag(library, tag.id, input.value, { now: now() }), 'Tag 名称已保存');
        renderTagManagement();
        renderArticleForm();
      }),
      mergeSelect,
      makeManagementButton('合并', 'secondary', async () => {
        if (!mergeSelect.value) throw new Error('请先选择目标 Tag');
        const target = library.tags.find(({ id }) => id === mergeSelect.value);
        if (!window.confirm(`把“${tag.name}”合并到“${target.name}”吗？`)) return;
        await persist(mergeTags(library, tag.id, target.id, { now: now() }), 'Tag 已合并');
        renderTagManagement();
        renderArticleForm();
      }),
      makeManagementButton('删除', 'danger', async () => {
        const count = countTagArticles(library, tag.id);
        if (count === 0) {
          if (!window.confirm(`确定删除 Tag“${tag.name}”吗？`)) return;
        } else {
          const typed = window.prompt(`删除后将从 ${count} 篇文章移除此 Tag。请输入“${tag.name}”确认：`);
          if (typed !== tag.name) throw new Error('输入的 Tag 名称不一致，已取消删除');
        }
        await persist(deleteTag(library, tag.id, { now: now() }), 'Tag 已删除');
        renderTagManagement();
        renderArticleForm();
      }),
    );
    row.append(field, actions);
    elements.tagList.append(row);
  }
}

elements.articleForm.addEventListener('input', () => setDirty(true));
elements.articleForm.addEventListener('change', () => setDirty(true));
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

elements.tagSearch.addEventListener('input', () => {
  const selectedIds = new FormData(elements.articleForm).getAll('tagIds');
  renderTagOptions(selectedIds);
});

document.querySelector('#manage-categories').addEventListener('click', () => {
  if (!confirmDiscard()) return;
  if (dirty) renderArticleForm();
  renderCategoryManagement();
  elements.categoryDialog.showModal();
});
document.querySelector('#manage-tags').addEventListener('click', () => {
  if (!confirmDiscard()) return;
  if (dirty) renderArticleForm();
  renderTagManagement();
  elements.tagDialog.showModal();
});
document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => button.closest('dialog').close());
});

elements.addCategoryForm.addEventListener('submit', handleAction(async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = new FormData(form).get('name');
  await persist(addCategory(library, name, { id: crypto.randomUUID(), now: now() }), '主分类已添加');
  form.reset();
  renderCategoryManagement();
  renderArticleForm();
}));

elements.addTagForm.addEventListener('submit', handleAction(async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = new FormData(form).get('name');
  await persist(addTag(library, name, { id: crypto.randomUUID(), now: now() }), 'Tag 已添加');
  form.reset();
  renderTagManagement();
  renderArticleForm();
}));

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
