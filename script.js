/* ===== Настройки ===== */
const ABACUS = "https://abacus.jasoncameron.dev";
const COUNTER_PATH = "k4ery/site-visits";
const VISITED_KEY = "ghost_visited";
const THEME_KEY = "ghost_theme";

/* ===== Игры берутся из файла games.json ===== */
let games = [];

/* ===== Тема ===== */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const toggle = document.getElementById("theme-toggle");
  if (toggle) toggle.setAttribute("aria-checked", String(theme === "dark"));
}

function initTheme() {
  let theme = "light";
  try { theme = localStorage.getItem(THEME_KEY) || "light"; } catch (e) {}
  applyTheme(theme);

  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    const next =
      document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  });
}

/* ===== Счётчик посетителей (Abacus) ===== */
async function fetchCount(action) {
  const res = await fetch(`${ABACUS}/${action}/${COUNTER_PATH}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.value;
}

async function initCounter() {
  const el = document.getElementById("visitor-count");
  if (!el) return;

  let visited = false;
  try { visited = localStorage.getItem(VISITED_KEY) === "1"; } catch (e) {}

  try {
    let value;
    if (visited) {
      // Уже заходил: только получаем число
      try {
        value = await fetchCount("get");
      } catch (e) {
        // Счётчик ещё не создан (404): создаём первым обращением
        value = await fetchCount("hit");
      }
    } else {
      // Первый визит: +1
      value = await fetchCount("hit");
      try { localStorage.setItem(VISITED_KEY, "1"); } catch (e) {}
    }
    el.textContent = Number(value).toLocaleString("ru-RU");
  } catch (err) {
    console.warn("Счётчик недоступен:", err);
    el.textContent = "—";
  }
}

/* ===== Карточки и поиск ===== */
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function renderGames(list) {
  const grid = document.getElementById("games-grid");
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `<p class="empty">${
      games.length === 0 ? "Игры скоро появятся 👻" : "Ничего не найдено"
    }</p>`;
    return;
  }

  grid.innerHTML = list.map((g) => `
    <article class="card">
      <img class="card-cover" src="${escapeHTML(g.cover)}" alt="${escapeHTML(g.title)}" loading="lazy" onerror="this.style.visibility='hidden'">
      <div class="card-body">
        <h3 class="card-title">${escapeHTML(g.title)}</h3>
        <a class="btn" href="${escapeHTML(g.url)}">▶ Играть</a>
      </div>
    </article>
  `).join("");
}

async function initSearch() {
  const input = document.getElementById("search");
  const grid = document.getElementById("games-grid");
  if (!input || !grid) return;

  try {
    const res = await fetch("games.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    games = await res.json();
  } catch (err) {
    console.warn("Не удалось прочитать games.json:", err);
    grid.innerHTML =
      '<p class="empty">Не удалось загрузить список игр. Проверь файл games.json (запятые и кавычки).</p>';
    return;
  }

  renderGames(games);
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    renderGames(
      games.filter((g) =>
        `${g.title} ${g.genre || ""}`.toLowerCase().includes(q)
      )
    );
  });
}

/* ===== Старт ===== */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initCounter();
  initSearch();
});
