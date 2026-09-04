const GITHUB_USERNAME = "PALPARAN70";
const API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=50`;

const REPOS_PER_PAGE = 3;
const BOOKMARKS_STORAGE_KEY = "palparan-bookmarked-repos";

function loadBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.error("Failed to read bookmarks from localStorage:", error);
    return new Set();
  }
}

function saveBookmarks(bookmarkSet) {
  try {
    localStorage.setItem(
      BOOKMARKS_STORAGE_KEY,
      JSON.stringify(Array.from(bookmarkSet)),
    );
  } catch (error) {
    console.error("Failed to save bookmarks to localStorage:", error);
  }
}

const state = {
  repos: [],
  query: "",
  isLoading: false,
  error: null,
  currentPage: 1,
  bookmarks: loadBookmarks(),
  showBookmarkedOnly: false,
};

function isBookmarked(repoName) {
  return state.bookmarks.has(repoName);
}

function toggleBookmark(repoName) {
  if (state.bookmarks.has(repoName)) {
    state.bookmarks.delete(repoName);
  } else {
    state.bookmarks.add(repoName);
  }
  saveBookmarks(state.bookmarks);
}

function setLoading(isLoading) {
  state.isLoading = isLoading;
  const spinner = document.querySelector("#spinner-wrap");
  if (spinner) spinner.style.display = isLoading ? "flex" : "none";
}

async function fetchRepos() {
  setLoading(true);
  state.error = null;

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`GitHub API responded with status ${response.status}`);
    }

    const data = await response.json();
    state.repos = data;
  } catch (error) {
    console.error("Failed to fetch repositories:", error);
    state.error =
      "Could not load projects right now. Please check your connection and try again later.";
  } finally {
    setLoading(false);
    render();
  }
}

function getFilteredRepos() {
  const query = state.query.trim().toLowerCase();

  let repos = state.repos;

  if (state.showBookmarkedOnly) {
    repos = repos.filter((repo) => isBookmarked(repo.name));
  }

  if (!query) return repos;
  return repos.filter((repo) => repo.name.toLowerCase().includes(query));
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function createRepoCard(repo) {
  const card = document.createElement("article");
  card.className = "repo-card";

  const cardHeader = document.createElement("div");
  cardHeader.className = "repo-card-header";

  const title = document.createElement("h3");
  title.textContent = repo.name;
  cardHeader.appendChild(title);

  const bookmarkBtn = document.createElement("button");
  bookmarkBtn.type = "button";
  bookmarkBtn.className = "bookmark-btn";
  const bookmarked = isBookmarked(repo.name);
  bookmarkBtn.setAttribute("aria-pressed", String(bookmarked));
  bookmarkBtn.setAttribute(
    "aria-label",
    bookmarked ? `Remove ${repo.name} from bookmarks` : `Bookmark ${repo.name}`,
  );
  bookmarkBtn.classList.toggle("is-bookmarked", bookmarked);
  bookmarkBtn.textContent = bookmarked ? "★" : "☆";
  bookmarkBtn.addEventListener("click", () => {
    toggleBookmark(repo.name);
    render();
  });
  cardHeader.appendChild(bookmarkBtn);

  card.appendChild(cardHeader);

  const desc = document.createElement("p");
  desc.className = "repo-desc";
  desc.textContent = repo.description || "No description provided.";
  card.appendChild(desc);

  const meta = document.createElement("div");
  meta.className = "repo-meta";

  if (repo.language) {
    const lang = document.createElement("span");
    const dot = document.createElement("span");
    dot.className = "lang-dot";
    lang.appendChild(dot);
    lang.append(repo.language);
    meta.appendChild(lang);
  }

  const stars = document.createElement("span");
  stars.textContent = `★ ${repo.stargazers_count}`;
  meta.appendChild(stars);

  const updated = document.createElement("span");
  updated.textContent = `Updated ${formatDate(repo.updated_at)}`;
  meta.appendChild(updated);

  card.appendChild(meta);

  const link = document.createElement("a");
  link.className = "repo-link";
  link.href = repo.html_url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "View on GitHub";
  card.appendChild(link);

  return card;
}

function renderPagination(totalItems) {
  const pagination = document.querySelector("#pagination");
  if (!pagination) return;

  pagination.innerHTML = "";

  const totalPages = Math.ceil(totalItems / REPOS_PER_PAGE);
  if (totalPages <= 1) return;

  const makeButton = (
    label,
    page,
    { disabled = false, current = false } = {},
  ) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "page-btn";
    btn.textContent = label;
    if (current) {
      btn.classList.add("is-current");
      btn.setAttribute("aria-current", "page");
    }
    if (disabled) {
      btn.disabled = true;
    } else {
      btn.addEventListener("click", () => {
        state.currentPage = page;
        render();
        document
          .querySelector("#gallery")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    return btn;
  };

  pagination.appendChild(
    makeButton("Previous", state.currentPage - 1, {
      disabled: state.currentPage === 1,
    }),
  );

  for (let page = 1; page <= totalPages; page += 1) {
    pagination.appendChild(
      makeButton(String(page), page, { current: page === state.currentPage }),
    );
  }

  pagination.appendChild(
    makeButton("Next", state.currentPage + 1, {
      disabled: state.currentPage === totalPages,
    }),
  );
}

function render() {
  const gallery = document.querySelector("#gallery");
  const metaLine = document.querySelector("#gallery-meta");
  const pagination = document.querySelector("#pagination");
  if (!gallery) return;

  gallery.innerHTML = "";

  if (state.isLoading) {
    metaLine.textContent = "";
    if (pagination) pagination.innerHTML = "";
    return;
  }

  if (state.error) {
    metaLine.textContent = "";
    if (pagination) pagination.innerHTML = "";
    const errorMsg = document.createElement("p");
    errorMsg.className = "empty-state";
    errorMsg.textContent = state.error;
    gallery.appendChild(errorMsg);
    return;
  }

  const filtered = getFilteredRepos();
  const baseCount = state.showBookmarkedOnly
    ? state.repos.filter((repo) => isBookmarked(repo.name)).length
    : state.repos.length;

  metaLine.textContent = state.query
    ? `${filtered.length} of ${baseCount} repositories match "${state.query}"`
    : `${baseCount} ${state.showBookmarkedOnly ? "bookmarked" : "public"} repositories`;

  if (filtered.length === 0) {
    if (pagination) pagination.innerHTML = "";
    const emptyMsg = document.createElement("p");
    emptyMsg.className = "empty-state";
    emptyMsg.textContent = state.showBookmarkedOnly
      ? "You haven't bookmarked any projects yet."
      : "No projects match your search.";
    gallery.appendChild(emptyMsg);
    return;
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / REPOS_PER_PAGE));
  if (state.currentPage > totalPages) state.currentPage = totalPages;
  if (state.currentPage < 1) state.currentPage = 1;

  const start = (state.currentPage - 1) * REPOS_PER_PAGE;
  const pageItems = filtered.slice(start, start + REPOS_PER_PAGE);

  pageItems.forEach((repo) => {
    gallery.appendChild(createRepoCard(repo));
  });

  renderPagination(filtered.length);
}

function initSearch() {
  const searchInput = document.querySelector("#project-search");
  const bookmarkFilter = document.querySelector("#bookmark-filter");

  searchInput?.addEventListener("input", (event) => {
    state.query = event.target.value;
    state.currentPage = 1;
    render();
  });

  bookmarkFilter?.addEventListener("change", (event) => {
    state.showBookmarkedOnly = event.target.checked;
    state.currentPage = 1;
    render();
  });
}

function init() {
  initSearch();
  fetchRepos();
}

document.addEventListener("DOMContentLoaded", init);
