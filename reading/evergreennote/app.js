const notes = {
  evergreenNotes: {
    title: "Evergreen notes",
    subtitle: "A note system that keeps growing as you think.",
    summary:
      "Evergreen notes are written and organized to evolve, contribute, and accumulate over time.",
    blocks: [
      {
        type: "p",
        text:
          "Evergreen notes are written and organized to evolve, contribute, and accumulate over time, across projects. This is an unusual way to think about writing notes: [[Most people take only transient notes|transient-notes]]. That’s because these practices aren’t about writing notes; they’re about effectively developing insight: [[Better note-taking misses the point; what matters is better thinking|better-thinking]]. When done well, these notes can be quite valuable: [[Evergreen note-writing as fundamental unit of knowledge work|fundamental-unit]].",
      },
      {
        type: "p",
        text: "It’s hard to write notes that are worth developing over time. These principles help:",
      },
      {
        type: "list",
        items: [
          "[[Evergreen notes should be atomic|atomic-notes]]",
          "[[Evergreen notes should be concept-oriented|concept-oriented]]",
          "[[Evergreen notes should be densely linked|densely-linked]]",
          "[[Prefer associative ontologies to hierarchical taxonomies|associative-ontologies]]",
          "[[Write notes for yourself by default, disregarding audience|write-for-yourself]]",
        ],
      },
      {
        type: "p",
        text:
          "This concept is of course enormously indebted to the notion of a [[Zettelkasten|zettelkasten]]. See [[Similarities and differences between evergreen note-writing and Zettelkasten|zettelkasten-diff]].",
      },
    ],
  },
  "writing-inbox": {
    title: "A writing inbox for transient and incomplete notes",
    subtitle: "Capture first, develop later.",
    summary:
      "A writing inbox catches unfinished notes so you can keep moving without losing them.",
    blocks: [
      {
        type: "p",
        text:
          "Even if you aspire to write [[Evergreen notes|evergreen-notes]], most notes begin as transient notes. You should be able to capture thoughts without friction ([[Close open loops|close-open-loops]]), then reliably develop them into evergreen notes over time ([[Knowledge work should accrete|knowledge-work-should-accrete]]). This implies two important mechanisms:",
      },
      {
        type: "list",
        items: [
          "a quick way to capture transient notes which clearly isolates them from evergreen notes",
          "a place to put notes you want to develop further and a practice which reliably drains it ([[Inboxes only work if you trust how they’re drained|trust-drained]])",
        ],
      },
      {
        type: "p",
        text:
          "I use a writing inbox for this purpose. Undeveloped ideas, excerpts from my [[Daily working log|daily-log]], notes from reading, one-line prompts, etc. all begin in that queue. During [[My morning writing practice|morning-writing]], I’ll look through notes in this inbox and spend time developing any that strike me.",
      },
      {
        type: "p",
        text:
          "Many notes in my writing inbox end up as evergreen notes, but that’s not appropriate for all of them. If a note doesn’t seem sufficiently interesting after a few looks, it’s best to archive or delete it.",
      },
    ],
  },
  "close-open-loops": {
    title: "Close open loops",
    subtitle: "Release mental clutter by trusting the system.",
    summary:
      "Tasks left undone and observations left unrecorded swirl around unless you can reliably handle them.",
    blocks: [
      {
        type: "p",
        text:
          "Tasks left undone, observations left unrecorded, replies yet to be written—these swirl about our minds, as if we’re rehearsing them over and over again to make sure they’re not forgotten. To get rid of this nagging and create a “mind like water”, build systems to reliably close these open loops.",
      },
      {
        type: "list",
        items: [
          "You should be able to record a task anywhere",
          "You regularly drain tasks from this list",
          "You regularly delegate, refactor, or delete tasks which you can’t prioritize",
        ],
      },
      {
        type: "p",
        text:
          "Taken together, these properties ensure that when you record a task, you can stop thinking about it. Ubiquitous capture isn’t enough, as most to-do systems demonstrate.",
      },
    ],
  },
  "reading-inbox": {
    title: "A reading inbox to capture possibly-useful references",
    subtitle: "The web is a stream. Don’t let it become a pile.",
    summary:
      "A reading inbox keeps references easy to capture, easy to revisit, and easy to discard.",
    blocks: [
      {
        type: "p",
        text:
          "To avoid a proliferation of anxiety-inducing browser tabs and a terrifying folder of PDFs, it’s important to have an automatic procedure for capturing references to readings which might prove useful.",
      },
      {
        type: "list",
        items: [
          "gets trashed if it doesn’t deserve detailed reading",
          "gets read in a serious fashion ([[Write about what you read to internalize texts deeply|write-about-what-you-read]])",
          "gets filed in the reference library",
          "maybe gets added to some other list like recipes to be cooked",
        ],
      },
      {
        type: "p",
        text:
          "The reading inbox is an important release valve for things I encounter when on my smartphone. Related: [[Incremental reading|incremental-reading]].",
      },
    ],
  },
  "densely-linked": {
    title: "Evergreen notes should be densely linked",
    subtitle: "Links create the network, not just the page.",
    summary:
      "Dense links make notes useful together, not just separately.",
    blocks: [
      {
        type: "p",
        text:
          "Hypertext only pays off when the links are doing real work. Evergreen notes should point to each other densely enough that a new note changes the shape of the surrounding network.",
      },
      {
        type: "p",
        text:
          "The point of a link is not decoration. It’s a claim about relationship: this idea helps explain that one, or depends on it, or stands in contrast to it.",
      },
      {
        type: "blockquote",
        text:
          "When notes are factored and titled well, those titles become handles for much larger idea clusters. That’s why a good note system feels like an API.",
      },
    ],
  },
  "write-for-yourself": {
    title: "Write notes for yourself by default, disregarding audience",
    subtitle: "Make the note useful before making it polished.",
    summary:
      "If notes are always drafted for an audience, they get heavier than they need to be.",
    blocks: [
      {
        type: "p",
        text:
          "Because Evergreen notes can be used as part of a strategy for writing public work, it’s tempting to save time by writing notes in publishable form. But that usually increases the overhead and effort in writing, often to the point of producing blockage.",
      },
      {
        type: "p",
        text:
          "The working draft can be rough. The point is to help your own thinking move forward, not to satisfy a hypothetical reader before the idea is ready.",
      },
    ],
  },
  "transient-notes": {
    title: "Most people take only transient notes",
    subtitle: "Useful in the moment, disposable later.",
    summary:
      "Transient notes are convenient, but they rarely add up into something durable.",
    blocks: [
      {
        type: "p",
        text:
          "In contrast to Evergreen notes, most people use notes as a bucket for storage or scratch thoughts. These are very convenient to write, but after a year of writing such notes, they’ll just have a pile of dissociated notes.",
      },
      {
        type: "p",
        text:
          "That isn’t a flaw in the person. It’s a signal that the note system is optimized for capture, not for insight accumulation.",
      },
    ],
  },
  "fundamental-unit": {
    title: "Evergreen note-writing as fundamental unit of knowledge work",
    subtitle: "Writing is the work, not just a record of it.",
    summary:
      "If the notes get good enough, writing them becomes the primary engine of knowledge work.",
    blocks: [
      {
        type: "p",
        text:
          "If you had to set one metric to use as a leading indicator for yourself as a knowledge worker, the best I know might be the number of Evergreen notes written per day.",
      },
      {
        type: "p",
        text:
          "Note-writing can be a virtuosic skill, but most people use notes as a bucket for storage or scratch thoughts. Evergreen note-writing flips that relationship around: the note itself is where the thinking accretes.",
      },
    ],
  },
  "better-thinking": {
    title: "“Better note-taking” misses the point; what matters is “better thinking”",
    subtitle: "The practice should improve cognition, not just capture.",
    summary:
      "Note systems are useful when they make thought sharper, not when they simply collect more information.",
    blocks: [
      {
        type: "p",
        text:
          "The point of taking notes is not to accumulate more raw material. The point is to make insight more likely, more connected, and more durable.",
      },
      {
        type: "blockquote",
        text:
          "A note system is only as good as the thinking it makes possible afterward.",
      },
    ],
  },
  "atomic-notes": {
    title: "Evergreen notes should be atomic",
    subtitle: "One note, one claim.",
    summary: "Atomic notes stay small enough to revise and combine.",
    blocks: [
      {
        type: "p",
        text:
          "A note should usually cover one idea well enough that it can be linked to, reused, and edited without dragging too much unrelated material along with it.",
      },
    ],
  },
  "concept-oriented": {
    title: "Evergreen notes should be concept-oriented",
    subtitle: "Organize around ideas rather than containers.",
    summary: "Concept-oriented notes cluster by idea, not by source or folder.",
    blocks: [
      {
        type: "p",
        text:
          "The point is to factor notes by concept so that links can accumulate across books, projects, and domains.",
      },
    ],
  },
  "associative-ontologies": {
    title: "Prefer associative ontologies to hierarchical taxonomies",
    subtitle: "Connections matter more than tree shape.",
    summary: "Associative organization keeps related ideas near each other.",
    blocks: [
      {
        type: "p",
        text:
          "A rigid taxonomy is useful for some tasks, but an associative network is better when the real goal is to support thought by linking ideas in many directions.",
      },
    ],
  },
  zettelkasten: {
    title: "Zettelkasten",
    subtitle: "A close cousin, not the same practice.",
    summary: "Zettelkasten is the older lineage that inspired much of this practice.",
    blocks: [
      {
        type: "p",
        text:
          "Zettelkasten is the note-taking tradition that most obviously influenced evergreen notes. The relationship is close, but the framing and emphasis are not identical.",
      },
    ],
  },
  "zettelkasten-diff": {
    title: "Similarities and differences between evergreen note-writing and Zettelkasten",
    subtitle: "Shared ancestry, different emphasis.",
    summary: "Evergreen notes borrow from Zettelkasten while keeping their own vocabulary.",
    blocks: [
      {
        type: "p",
        text:
          "Evergreen notes share Zettelkasten’s respect for connected notes, but they’re pitched as an evolving writing practice rather than as a strict transcription of the older system.",
      },
    ],
  },
  "knowledge-work-should-accrete": {
    title: "Knowledge work should accrete",
    subtitle: "The work should build on itself.",
    summary: "A good note practice should make future thinking easier, not reset it.",
    blocks: [
      {
        type: "p",
        text:
          "The goal is for thought to add up over time. Each note should become a foothold for future work rather than a dead end.",
      },
    ],
  },
  "trust-drained": {
    title: "Inboxes only work if you trust how they’re drained",
    subtitle: "Reliability is the real feature.",
    summary: "An inbox fails if it becomes a graveyard of unresolved items.",
    blocks: [
      {
        type: "p",
        text:
          "Reliable inboxes are powerful because they let us close open loops without keeping every single item in working memory.",
      },
    ],
  },
  "daily-log": {
    title: "Daily working log",
    subtitle: "Low-fidelity scratch space.",
    summary: "A daily log is a transient layer that feeds better notes later.",
    blocks: [
      {
        type: "p",
        text:
          "The daily working log is the lowest-fidelity layer in the note stack. Scratch thoughts can live there until they’re ready to be extracted or discarded.",
      },
    ],
  },
  "morning-writing": {
    title: "My morning writing practice",
    subtitle: "Begin with the inbox, then pick something to grow.",
    summary: "Morning writing is often an inbox triage session in disguise.",
    blocks: [
      {
        type: "p",
        text:
          "I usually begin by opening my writing inbox and flipping through prompts and incomplete notes. If any strike me, I draft evergreen notes about them.",
      },
    ],
  },
  "write-about-what-you-read": {
    title: "Write about what you read to internalize texts deeply",
    subtitle: "Reading becomes sharper when it becomes writing.",
    summary: "Writing about a text is a stronger way to understand it.",
    blocks: [
      {
        type: "p",
        text:
          "For deep understanding, it’s not enough to just highlight or write marginalia in books. Instead, write evergreen notes as you read.",
      },
    ],
  },
  "incremental-reading": {
    title: "Incremental reading",
    subtitle: "Read and revisit in small loops.",
    summary: "Incremental reading works well with a reliable reading inbox.",
    blocks: [
      {
        type: "p",
        text:
          "Incremental reading breaks larger reading work into small revisitable chunks, which pairs well with a reading inbox and the habit of closing open loops.",
      },
    ],
  },
  "evergreen-notes": {
    title: "Evergreen notes",
    subtitle: "Alias for the root note.",
    summary: "This alias lets links point back to the root note title naturally.",
    blocks: [
      {
        type: "p",
        text:
          "This note simply reuses the main Evergreen notes page so links like [[Evergreen notes|evergreen-notes]] can resolve cleanly.",
      },
    ],
  },
};

notes["evergreen-notes"] = notes.evergreenNotes;

const noteScroller = document.getElementById("noteScroller");
const previewCard = document.getElementById("previewCard");
const previewTitle = document.getElementById("previewTitle");
const previewExcerpt = document.getElementById("previewExcerpt");

const state = {
  stack: parseStackFromUrl(),
  hoveredSlug: null,
  hoveredAnchor: null,
};

function parseStackFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const root = params.get("note") || "evergreenNotes";
  const stacked = params.getAll("stackedNotes").filter(Boolean);
  const stack = [root, ...stacked];
  return dedupeValidStack(stack);
}

function dedupeValidStack(slugs) {
  const result = [];
  for (const slug of slugs) {
    if (!notes[slug]) continue;
    if (result[result.length - 1] === slug) continue;
    result.push(slug);
  }
  return result.length ? result : ["evergreenNotes"];
}

function buildUrl(stack) {
  const params = new URLSearchParams();
  params.set("note", stack[0]);
  for (const slug of stack.slice(1)) {
    params.append("stackedNotes", slug);
  }
  return `${window.location.pathname}?${params.toString()}`;
}

function parseInline(text, ownerSlug) {
  const fragment = document.createDocumentFragment();
  const regex = /\[\[(.+?)(?:\|(.+?))?\]\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) {
      fragment.append(text.slice(lastIndex, match.index));
    }

    const label = match[1];
    const target = match[2] || slugify(label);
    const anchor = document.createElement("a");
    anchor.href = `?${new URLSearchParams({ note: target }).toString()}`;
    anchor.className = "note-link";
    anchor.dataset.target = target;
    anchor.dataset.owner = ownerSlug;
    anchor.textContent = label;
    attachPreviewHandlers(anchor, target);
    fragment.append(anchor);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    fragment.append(text.slice(lastIndex));
  }

  return fragment;
}

function attachPreviewHandlers(anchor, target) {
  anchor.addEventListener("mouseover", () => {
    state.hoveredSlug = target;
    state.hoveredAnchor = anchor;
    updateActivePane();
  });

  anchor.addEventListener("focus", () => {
    state.hoveredSlug = target;
    state.hoveredAnchor = anchor;
    updateActivePane();
  });

  anchor.addEventListener("mouseout", (event) => {
    if (event.relatedTarget && anchor.contains(event.relatedTarget)) return;
    if (state.hoveredAnchor === anchor) {
      state.hoveredSlug = null;
      state.hoveredAnchor = null;
      updateActivePane();
    }
  });

  anchor.addEventListener("blur", () => {
    if (state.hoveredAnchor === anchor) {
      state.hoveredSlug = null;
      state.hoveredAnchor = null;
      updateActivePane();
    }
  });
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderBlock(block, slug) {
  if (block.type === "p") {
    const p = document.createElement("p");
    p.append(parseInline(block.text, slug));
    return p;
  }

  if (block.type === "blockquote") {
    const quote = document.createElement("blockquote");
    quote.append(parseInline(block.text, slug));
    return quote;
  }

  if (block.type === "list") {
    const list = document.createElement("ul");
    for (const item of block.items) {
      const li = document.createElement("li");
      li.append(parseInline(item, slug));
      list.append(li);
    }
    return list;
  }

  return document.createTextNode("");
}

function getBacklinks(slug) {
  const backlinks = [];
  for (const [candidateSlug, note] of Object.entries(notes)) {
    if (candidateSlug === slug) continue;
    const haystack = JSON.stringify(note.blocks);
    if (haystack.includes(`|${slug}]]`) || haystack.includes(`[[${slug}]]`)) {
      backlinks.push({
        slug: candidateSlug,
        title: note.title,
        summary: note.summary,
      });
    }
  }
  return backlinks;
}

function makeNotePane(slug, index, total) {
  const note = notes[slug];
  const pane = document.createElement("section");
  pane.className = "note-pane";
  pane.dataset.slug = slug;
  pane.dataset.index = String(index);
  pane.dataset.total = String(total);

  const article = document.createElement("article");
  article.className = "note-card";

  const title = document.createElement("h2");
  title.className = "note-title";
  title.textContent = note.title;
  article.append(title);

  const subtitle = document.createElement("p");
  subtitle.className = "note-subtitle";
  subtitle.textContent = note.subtitle;
  article.append(subtitle);

  const body = document.createElement("div");
  body.className = "note-body";
  for (const block of note.blocks) {
    body.append(renderBlock(block, slug));
  }
  article.append(body);

  const footer = document.createElement("footer");
  footer.className = "note-footer";

  const backlinks = getBacklinks(slug);
  if (backlinks.length) {
    const label = document.createElement("p");
    label.className = "note-section-title";
    label.textContent = "Links to this note";
    footer.append(label);

    const list = document.createElement("div");
    list.className = "backlink-list";
    for (const backlink of backlinks) {
      const link = document.createElement("a");
      link.className = "backlink";
      link.href = `?${new URLSearchParams({ note: backlink.slug }).toString()}`;
      link.dataset.target = backlink.slug;
      attachPreviewHandlers(link, backlink.slug);

      const linkTitle = document.createElement("span");
      linkTitle.className = "backlink-title";
      linkTitle.textContent = backlink.title;

      const snippet = document.createElement("span");
      snippet.className = "backlink-snippet";
      snippet.textContent = backlink.summary;

      link.append(linkTitle, snippet);
      list.append(link);
    }
    footer.append(list);
  }

  article.append(footer);
  pane.append(article);

  pane.addEventListener("click", (event) => {
    const target = event.target.closest("[data-target]");
    if (!target) return;
    event.preventDefault();
    openTarget(target.dataset.target);
  });

  return pane;
}

function render() {
  const stack = dedupeValidStack(state.stack);
  state.stack = stack;
  noteScroller.innerHTML = "";

  stack.forEach((slug, index) => {
    noteScroller.append(makeNotePane(slug, index, stack.length));
  });

  noteScroller.append(createSpacer());
  noteScroller.scrollLeft = 0;
  updateUrl();
  updateLayout();
  requestAnimationFrame(() => {
    const activePane = noteScroller.querySelector(`.note-pane[data-index="${stack.length - 1}"]`);
    if (activePane) {
      activePane.scrollIntoView({ behavior: "smooth", inline: "end", block: "nearest" });
    }
  });
}

function createSpacer() {
  const spacer = document.createElement("div");
  spacer.style.flex = "0 0 24px";
  spacer.setAttribute("aria-hidden", "true");
  return spacer;
}

function updateUrl() {
  const nextUrl = buildUrl(state.stack);
  window.history.replaceState({}, "", nextUrl);
}

function openTarget(slug) {
  if (!notes[slug]) return;
  const nextStack = state.stack.slice();
  const existingIndex = nextStack.indexOf(slug);

  if (existingIndex >= 0) {
    state.stack = nextStack.slice(0, existingIndex + 1);
  } else {
    state.stack = [...nextStack, slug];
  }

  state.hoveredSlug = null;
  render();
}

function updateActivePane() {
  const panes = Array.from(noteScroller.querySelectorAll(".note-pane"));
  for (const pane of panes) {
    const slug = pane.dataset.slug;
    pane.classList.toggle("is-active", slug === state.stack[state.stack.length - 1]);
  }
  if (state.hoveredSlug && state.hoveredAnchor) {
    showPreview(state.hoveredSlug, state.hoveredAnchor);
  } else {
    hidePreview();
  }
}

function updateLayout() {
  const scrollerRect = noteScroller.getBoundingClientRect();
  const panes = Array.from(noteScroller.querySelectorAll(".note-pane"));
  for (const pane of panes) {
    const rect = pane.getBoundingClientRect();
    const visibleWidth = Math.max(
      0,
      Math.min(rect.right, scrollerRect.right) - Math.max(rect.left, scrollerRect.left),
    );
    const ratio = rect.width ? visibleWidth / rect.width : 0;
    const shouldCollapse = ratio < 0.32 && pane.dataset.slug !== state.stack[state.stack.length - 1];
    pane.classList.toggle("is-collapsed", shouldCollapse);
  }
  updateActivePane();
}

function showPreview(slug, anchor) {
  const note = notes[slug];
  if (!note) return;
  previewTitle.textContent = note.title;
  previewExcerpt.textContent = note.summary;
  previewCard.hidden = false;

  const rect = anchor.getBoundingClientRect();
  const maxLeft = window.innerWidth - 360;
  const left = Math.max(16, Math.min(rect.right + 18, maxLeft));
  const top = Math.max(18, Math.min(rect.top + 26, window.innerHeight - 180));
  previewCard.style.left = `${left}px`;
  previewCard.style.top = `${top}px`;
}

function hidePreview() {
  previewCard.hidden = true;
}

noteScroller.addEventListener(
  "wheel",
  (event) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    noteScroller.scrollLeft += event.deltaY + event.deltaX;
    updateLayout();
  },
  { passive: false },
);

noteScroller.addEventListener("mousemove", (event) => {
  const anchor = event.target.closest?.("[data-target]");
  if (!anchor || !noteScroller.contains(anchor)) return;
  const target = anchor.dataset.target;
  if (!notes[target]) return;
  state.hoveredSlug = target;
  state.hoveredAnchor = anchor;
  updateActivePane();
});

noteScroller.addEventListener("mouseleave", () => {
  state.hoveredSlug = null;
  state.hoveredAnchor = null;
  updateActivePane();
});

noteScroller.addEventListener("scroll", () => {
  window.requestAnimationFrame(updateLayout);
});

window.addEventListener("resize", () => {
  window.requestAnimationFrame(updateLayout);
});

window.addEventListener("popstate", () => {
  state.stack = parseStackFromUrl();
  render();
});

window.addEventListener("pointermove", (event) => {
  if (!state.hoveredSlug || previewCard.hidden) return;
  const left = Math.min(event.clientX + 18, window.innerWidth - 360);
  const top = Math.min(event.clientY + 18, window.innerHeight - 180);
  previewCard.style.left = `${Math.max(16, left)}px`;
  previewCard.style.top = `${Math.max(18, top)}px`;
});

render();
