const navItems = Array.from(document.querySelectorAll("[data-view]"));
const panels = Array.from(document.querySelectorAll("[data-view-panel]"));

function showView(view) {
  navItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.view === view);
  });

  panels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.viewPanel === view);
  });
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-view]");
  if (!trigger) return;
  showView(trigger.dataset.view);
});
