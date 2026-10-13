
"use strict";

/* ========================================
   PRAGYA PORTFOLIO: INTERACTIVE FEATURES
   ======================================== */

document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initMobileMenu();
});

/* ========================================
   1. THEME TOGGLE
   ======================================== */

function initThemeToggle() {
    const themeButton = document.getElementById("theme-toggle");

    if (!themeButton) return;

    const savedTheme = getSavedTheme();

    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
    }

    updateThemeButton(themeButton);

    themeButton.addEventListener("click", () => {
        const isLightMode = document.body.classList.toggle("light-mode");
        const theme = isLightMode ? "light" : "dark";

        saveTheme(theme);
        updateThemeButton(themeButton);
    });
}

function getSavedTheme() {
    try {
        return localStorage.getItem("portfolio-theme") || "dark";
    } catch {
        return "dark";
    }
}

function saveTheme(theme) {
    try {
        localStorage.setItem("portfolio-theme", theme);
    } catch {
        // The theme still works if browser storage is unavailable.
    }
}

function updateThemeButton(button) {
    const isLightMode = document.body.classList.contains("light-mode");

    button.textContent = isLightMode ? "🌙 Dark Mode" : "☀️ Light Mode";
    button.setAttribute("aria-label", "Switch to " + (isLightMode ? "dark" : "light") + " mode");
    button.setAttribute("aria-pressed", String(isLightMode));
}

/* ========================================
   2. RESPONSIVE MOBILE MENU
   ======================================== */

function initMobileMenu() {
    const menuButton = document.getElementById("menu-toggle");
    const navLinks = document.getElementById("nav-links");

    if (!menuButton || !navLinks) return;

    function setMenuState(isOpen) {
        navLinks.classList.toggle("open", isOpen);
        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.textContent = isOpen ? "✕ Close" : "☰ Menu";
    }

    menuButton.addEventListener("click", () => {
        const isOpen = navLinks.classList.contains("open");
        setMenuState(!isOpen);
    });

    // Close the menu after choosing a navigation link.
    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            setMenuState(false);
        });
    });

    // Close the mobile menu with the Escape key.
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && navLinks.classList.contains("open")) {
            setMenuState(false);
            menuButton.focus();
        }
    });

    // Reset the menu when moving back to the desktop layout.
    window.addEventListener("resize", () => {
        if (window.innerWidth > 760) {
            setMenuState(false);
        }
    });

    setMenuState(false);
}
