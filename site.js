/* ===== Shared on every page: burger menu (+ highlights the current page) ===== */
(() => {
    const PAGES = [
        ["index.html", "Home"],
        ["about.html", "About"],
        ["skills.html", "Skills"],
        ["projects.html", "Projects"],
        ["achievements.html", "Achievements"],
        ["blog.html", "Blog"],
        ["contact.html", "Contact"]
    ];

    const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();

    function markCurrent(panel) {
        panel.querySelectorAll("a").forEach((a) => {
            const href = (a.getAttribute("href") || "").toLowerCase();
            if (href === here) a.setAttribute("aria-current", "page");
        });
    }

    function wireMenu(btn, panel) {
        function setOpen(open, returnFocus) {
            panel.classList.toggle("open", open);
            btn.setAttribute("aria-expanded", String(open));
            btn.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
            btn.textContent = open ? "✕" : "☰";
            if (!open && returnFocus) btn.focus();
        }

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            setOpen(!panel.classList.contains("open"));
        });

        // Click anywhere outside closes the menu
        document.addEventListener("click", (e) => {
            if (panel.classList.contains("open") && !panel.contains(e.target) && e.target !== btn) {
                setOpen(false);
            }
        });

        // Choosing a link closes the menu
        panel.addEventListener("click", (e) => {
            if (e.target.closest("a")) setOpen(false);
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && panel.classList.contains("open")) setOpen(false, true);
        });

        // Coming back with the Back button should never show an open menu
        window.addEventListener("pageshow", () => setOpen(false));

        markCurrent(panel);
    }

    // Homepage: the menu already exists in the HTML
    const homeBtn = document.getElementById("menu-toggle");
    const homePanel = document.getElementById("nav-links");
    if (homeBtn && homePanel) {
        wireMenu(homeBtn, homePanel);
        return;
    }

    // Inner pages: build the same menu and put it where the "← Home" link was
    const header = document.querySelector("header");
    if (!header) return;

    const wrap = document.createElement("div");
    wrap.className = "vc-menu";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vc-menu-btn";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "vc-menu-panel");
    btn.setAttribute("aria-label", "Open navigation menu");
    btn.textContent = "☰";

    const panel = document.createElement("nav");
    panel.className = "vc-menu-panel";
    panel.id = "vc-menu-panel";
    panel.setAttribute("aria-label", "Main navigation");
    PAGES.forEach(([href, label]) => {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = label;
        panel.appendChild(a);
    });

    wrap.append(btn, panel);

    const homeLink = [...header.querySelectorAll('a[href="index.html"]')]
        .find((a) => !a.querySelector("img"));
    if (homeLink) homeLink.replaceWith(wrap);
    else header.appendChild(wrap);

    wireMenu(btn, panel);
})();

/* ===== HIDDEN UNIVERSE: SHARED PAGE TRANSITIONS ===== */
(() => {
    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    // Create the overlay without changing existing page HTML.
    const overlay = document.createElement("div");
    overlay.className = "hu-page-transition";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);

    let navigating = false;
    let navigationTimer;

    function resetTransition() {
        clearTimeout(navigationTimer);
        navigating = false;
        overlay.classList.remove("active");
    }

    // Restore the page when returning through browser Back/Forward.
    window.addEventListener("pageshow", resetTransition);

    document.addEventListener("click", (event) => {
        const link = event.target.closest("a[href]");
        if (!link || navigating || reduceMotion) return;

        // Preserve new-tab clicks, downloads, and browser shortcuts.
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey ||
            link.target === "_blank" ||
            link.hasAttribute("download")
        ) {
            return;
        }

        // Keep the existing cinematic portal in control.
        if (
            link.matches(".enter-button") ||
            link.closest("#portalTransition")
        ) {
            return;
        }

        const destination = new URL(link.href, window.location.href);

        // Only animate ordinary links to another local HTML page.
        if (
            destination.origin !== window.location.origin ||
            destination.pathname === window.location.pathname ||
            destination.hash ||
            !/\.html?$/i.test(destination.pathname)
        ) {
            return;
        }

        event.preventDefault();
        navigating = true;
        overlay.classList.add("active");

        navigationTimer = window.setTimeout(() => {
            window.location.href = destination.href;
        }, 180);
    });
})();
/* ===== GLOBAL HIDDEN UNIVERSE INJECTOR ===== */
(() => {
    // 1. Inject Global Modal and Digital Soul Orb into document.body
    if (!document.getElementById("huModal")) {
        const modalHTML = `
            <div class="hu-modal" id="huModal">
                <div class="hu-modal-card">
                    <button class="hu-modal-close" id="huModalClose">✕</button>
                    <h3 id="huModalTitle" style="color: #8be9ff; margin-bottom: 12px; font-family: 'Space Grotesk', sans-serif;"></h3>
                    <p id="huModalText" style="color: #d0d8e9; font-size: 15px; line-height: 1.8;"></p>
                </div>
            </div>
            <div class="digital-soul-orb" id="digitalSoulOrb" title="Tap the Digital Soul"></div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    const modal = document.getElementById("huModal");
    const modalTitle = document.getElementById("huModalTitle");
    const modalText = document.getElementById("huModalText");
    const modalClose = document.getElementById("huModalClose");

    function showModal(title, text) {
        if (!modal) return;
        modalTitle.textContent = title;
        modalText.textContent = text;
        modal.classList.add("active");
    }

    if (modalClose) {
        modalClose.addEventListener("click", () => modal.classList.remove("active"));
        modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("active"); });
    }

    // 2. Wandering Digital Soul Orb (Glides to random positions periodically)
    const soulOrb = document.getElementById("digitalSoulOrb");
    if (soulOrb) {
        // Initial position
        soulOrb.style.left = (window.innerWidth - 100) + 'px';
        soulOrb.style.top = (window.innerHeight - 120) + 'px';

        function moveSoulOrb() {
            // Keep it safely within viewport bounds (leaving 80px margin)
            const randomX = Math.random() * (window.innerWidth - 160) + 80;
            const randomY = Math.random() * (window.innerHeight - 200) + 100;
            
            soulOrb.style.left = randomX + 'px';
            soulOrb.style.top = randomY + 'px';
        }

        // Move the orb every 5 seconds
        setInterval(moveSoulOrb, 5000);

        const soulThoughts = [
            "🧠 Digital Soul Reflection: 'What is code if not structured thought waiting to execute?'",
            "⚡ Current System State: Operating at optimal curiosity across all modules.",
            "🌌 Universe Status: Wandering constellations detected across temporal frequencies on this page.",
            "☕ Philosophical Query: Can an artificial intellect truly appreciate a quiet midnight debugging session?"
        ];

        soulOrb.addEventListener("click", () => {
            const thought = soulThoughts[Math.floor(Math.random() * soulThoughts.length)];
            showModal("The Sentient Digital Soul", thought);
            soulOrb.style.boxShadow = "0 0 50px #8be9ff, inset 0 0 25px #ffffff";
            setTimeout(() => soulOrb.style.boxShadow = "", 1000);
        });
    }

    // 3. Wandering Constellations (Randomly spawning on any page)
    function spawnConstellation() {
        if (document.querySelector('.constellation-star')) return;
        const star = document.createElement('div');
        star.className = 'constellation-star';
        
        star.style.left = (Math.random() * (window.innerWidth - 120) + 60) + 'px';
        star.style.top = (Math.random() * (window.innerHeight - 250) + 80) + 'px';

        star.addEventListener('click', () => {
            const secrets = [
                { t: "✨ Constellation Pattern Unlocked", b: "You discovered a hidden data node while browsing this page. The system is expanding." },
                { t: "🚀 Project Node Discovered", b: "Checking out repositories and code structure? Keep building with purpose." },
                { t: "💡 Idea Fragment", b: "Code is poetry translated into logic. Every page is part of the broader universe." }
            ];
            const s = secrets[Math.floor(Math.random() * secrets.length)];
            showModal(s.t, s.b);
            star.remove();
        });

        document.body.appendChild(star);
        setTimeout(() => star.style.opacity = '1', 150);

        setTimeout(() => {
            if (star.parentNode) {
                star.style.opacity = '0';
                setTimeout(() => star.remove(), 600);
            }
        }, 9000);
    }

    // Spawn constellations at unpredictable intervals (between 20 to 40 seconds) on any page
    setInterval(spawnConstellation, Math.random() * 20000 + 20000);
})();