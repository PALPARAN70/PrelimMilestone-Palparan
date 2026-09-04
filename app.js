/**
 * Shared across all pages — mobile nav toggle + active link marking.
 */

function initNav() {
  const toggle = document.querySelector("#navToggle");
  const menu = document.querySelector("#navMenu");

  toggle?.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Mark the current page's nav link for styling + screen readers
  const links = document.querySelectorAll(".nav-menu a");
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPage) {
      link.setAttribute("aria-current", "page");
    }
  });
}

document.addEventListener("DOMContentLoaded", initNav);
