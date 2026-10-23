/**
 * Brittfurn × Vikingshöjd – kategorin "Gardiner" i tillvalsportalen.
 *
 * Läggs in efter js/app-v2.js:
 *   <script>window.BF_GARDINER_URL = "https://<brittfurns-adress>/gardiner-vikingshojd/";</script>
 *   <script src="js/brittfurn-gardiner.js"></script>
 *
 * Gör tre saker:
 *  1. Lägger till kategorin "Gardiner" sist i menyn och i listan, med Brittfurns gardinapp i en iframe.
 *  2. Tar emot kundens val från appen (postMessage) och lägger dem i portalens sammanställning
 *     som vanliga rader (namn, beskrivning, pris) – de följer då med i totalen och i PDF:en.
 *  3. Skickar portalens valda hustyp till appen när den ändras.
 */
(function () {
  const APP_URL = window.BF_GARDINER_URL;
  const APP_ORIGIN = (() => { try { return new URL(APP_URL).origin; } catch (e) { return "*"; } })();
  const PREFIX = "bf-gardin-";
  let frame = null;
  let lastFilter = null;

  function el(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  function mount() {
    const nav = document.getElementById("category-nav");
    const cats = document.getElementById("categories-container");
    if (!nav || !cats) return;
    if (!document.getElementById("category-gardiner")) {
      const n = cats.querySelectorAll("section.category").length + 1;
      const li = el(`<li><a href="#category-gardiner" class="sidebar__nav-item" data-category="gardiner">
          <span class="sidebar__nav-number">${n}</span><span>Gardiner</span></a></li>`);
      li.querySelector("a").addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("category-gardiner")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      const AFTER = window.BF_GARDINER_AFTER || "garderober";
      const navAfter = nav.querySelector(`a[data-category="${AFTER}"]`)?.closest("li");
      if (navAfter) navAfter.after(li); else nav.appendChild(li);
      const filter = (typeof state !== "undefined" && state.activeHouseFilter) || "";
      const sec = el(`<section class="category" data-category-id="gardiner" id="category-gardiner">
          <div class="category__header">
            <div class="category__header-content"><span class="category__number">${n}</span><h2 class="category__title">Gardiner</h2></div>
            <p class="category__description">Måttsydda gardiner från Brittfurn – välj tyg och färg för varje rum och se resultatet direkt.</p>
          </div>
          <iframe id="bf-gardiner-frame" title="Gardiner från Brittfurn" loading="lazy"
            src="${APP_URL}${APP_URL.includes("?") ? "&" : "?"}embed=1&house=${encodeURIComponent(filter)}"
            style="width:100%;height:1400px;border:0;display:block;background:transparent"></iframe>
        </section>`);
      const secAfter = document.getElementById("category-" + AFTER);
      if (secAfter) secAfter.after(sec); else cats.appendChild(sec);
      // numrera om menyn och rubrikerna
      nav.querySelectorAll(".sidebar__nav-number").forEach((el, i) => (el.textContent = i + 1));
      cats.querySelectorAll("section.category .category__number").forEach((el, i) => (el.textContent = i + 1));
    }
    frame = document.getElementById("bf-gardiner-frame");
  }

  function applyItems(items) {
    if (typeof state === "undefined" || !state.selectedItems) return;
    for (const id of Array.from(state.selectedItems.keys())) if (id.startsWith(PREFIX)) state.selectedItems.delete(id);
    for (const it of items || []) {
      if (!it || !String(it.id).startsWith(PREFIX)) continue;
      const item = { id: String(it.id), name: String(it.name), description: String(it.description || ""), price: Number(it.price) || 0, houseTypes: [], _houseFilters: [] };
      state.itemsById.set(item.id, item);
      state.selectedItems.set(item.id, { item, quantity: 1 });
    }
    if (typeof updateSummary === "function") updateSummary();
  }

  window.addEventListener("message", (e) => {
    if (APP_ORIGIN !== "*" && e.origin !== APP_ORIGIN) return;
    const d = e.data || {};
    if (d.type === "bf-gardiner") { applyItems(d.items); if (frame && d.height) frame.style.height = d.height + "px"; }
    if (d.type === "bf-gardiner-height" && frame && d.height) frame.style.height = d.height + "px";
  });

  // Husfiltret: skicka till appen när det ändras
  setInterval(() => {
    const f = typeof state !== "undefined" ? state.activeHouseFilter : null;
    if (f && f !== lastFilter && frame && frame.contentWindow) { lastFilter = f; frame.contentWindow.postMessage({ type: "bf-house", filter: f }, APP_ORIGIN); }
    if (!document.getElementById("category-gardiner")) mount();
  }, 500);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
