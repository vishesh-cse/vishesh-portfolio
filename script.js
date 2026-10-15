const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation menu" : "Open navigation menu"
    );
    menuToggle.textContent = isOpen ? "✕" : "☰";
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navLinks.classList.contains("open")) {
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");
        menuToggle.textContent = "☰";
        menuToggle.focus();
    }
});

const shayaris = document.querySelectorAll(".shayari");
const dots = document.querySelectorAll(".shayari-dots button");
let currentShayari = 0;
let shayariTimer;

function showShayari(index) {
    currentShayari = index;

    shayaris.forEach((item, i) => {
        item.classList.toggle("active", i === index);
    });

    dots.forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
        dot.setAttribute("aria-pressed", String(i === index));
    });
}

function startShayariRotation() {
    clearInterval(shayariTimer);
    shayariTimer = setInterval(() => {
        showShayari((currentShayari + 1) % shayaris.length);
    }, 5000);
}

dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
        showShayari(index);
        startShayariRotation();
    });
});

showShayari(0);
startShayariRotation();

/* ===== Phase 2: Live hero (aurora light, stars, particles, flowing river) =====
   Tip: open the site with ?debugriver at the end of the URL to see the river lanes. */
(function () {
    const landing = document.querySelector('.landing');
    if (!landing) return;

    const DEBUG = location.search.includes('debugriver');
    const IMG_W = 1536, IMG_H = 896;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const canvas = document.createElement('canvas');
    canvas.className = 'live-hero';
    canvas.setAttribute('aria-hidden', 'true');
    landing.insertBefore(canvas, landing.firstChild);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // River lanes in image coordinates (1536x896), listed in flow direction (far -> near).
    // To adjust where the light flows, change these points.
    const LANES = [
        { pts: [[1067, 608], [907, 585], [725, 576], [597, 580]], count: 16 },
        { pts: [[821, 670], [640, 699], [459, 717], [277, 717], [128, 745]], count: 26 },
        { pts: [[512, 736], [597, 779], [747, 821], [875, 853]], count: 16 }
    ];

    function smoothPath(pts, n) {
        const p = [pts[0], ...pts, pts[pts.length - 1]];
        const segs = pts.length - 1;
        const out = [];
        for (let i = 0; i < n; i++) {
            const u = (i / (n - 1)) * segs;
            const k = Math.min(Math.floor(u), segs - 1);
            const t = u - k;
            const f = (a, b, c, d) =>
                0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
            const [p0, p1, p2, p3] = [p[k], p[k + 1], p[k + 2], p[k + 3]];
            out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
        }
        return out;
    }
    LANES.forEach(l => { l.path = smoothPath(l.pts, 90); });

    let W = 0, H = 0, s = 1, ox = 0, oy = 0;
    let stars = [], motes = [];
    const rand = (a, b) => a + Math.random() * (b - a);

    function resize() {
        const r = landing.getBoundingClientRect();
        W = r.width; H = r.height;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // same math as "background: center / cover" plus the 1.02 scale on .landing::before
        s = Math.max(W / IMG_W, H / IMG_H) * 1.02;
        ox = (W - IMG_W * s) / 2;
        oy = (H - IMG_H * s) / 2;

        const nStars = Math.max(40, Math.min(110, Math.round((W * H) / 9000)));
        stars = Array.from({ length: nStars }, () => ({
            x: rand(0, W), y: rand(0, H * 0.62), r: rand(0.6, 1.6), ph: rand(0, 6.28), sp: rand(0.8, 2.2)
        }));
        const nMotes = Math.max(18, Math.min(70, Math.round((W * H) / 20000)));
        motes = Array.from({ length: nMotes }, () => ({
            x: rand(0, W), y: rand(0, H), r: rand(1, 2.6), vx: rand(-4, 4), vy: rand(-9, -3),
            hue: Math.random() < 0.5 ? 185 : 285, ph: rand(0, 6.28)
        }));
        if (reduceMotion) draw(performance.now(), 0);
    }

    function newStreak(lane, initial) {
        return {
            lane,
            t: initial ? Math.random() * 1.2 : 0,
            speed: rand(0.022, 0.05),
            len: rand(0.12, 0.3),
            off: rand(-22, 22),
            hue: [185, 270, 310][Math.floor(Math.random() * 3)],
            w: rand(1, 2.4),
            a: rand(0.6, 1)
        };
    }
    const streaks = [];
    LANES.forEach(l => { for (let i = 0; i < l.count; i++) streaks.push(newStreak(l, true)); });

    function pos(path, t, off) {
        const N = path.length - 1;
        const f = Math.max(0, Math.min(1, t)) * N;
        const i = Math.min(Math.floor(f), N - 1);
        const u = f - i;
        const x = path[i][0] + (path[i + 1][0] - path[i][0]) * u;
        const y = path[i][1] + (path[i + 1][1] - path[i][1]) * u + off;
        return [x * s + ox, y * s + oy];
    }

    function drawStreak(st, dt) {
        st.t += st.speed * dt;
        if (st.t - st.len > 1) Object.assign(st, newStreak(st.lane, false));
        const steps = 6;
        const lw = Math.max(0.8, st.w * s * 1.3);
        let prev = null;
        for (let k = 0; k <= steps; k++) {
            const t = st.t - st.len * (k / steps);
            if (t < 0 || t > 1) { prev = null; continue; }
            const p = pos(st.lane.path, t, st.off);
            if (prev) {
                const fade = (1 - k / steps) * Math.sin(Math.PI * t) * st.a;
                ctx.lineCap = 'round';
                ctx.strokeStyle = `hsla(${st.hue},100%,72%,${fade * 0.22})`;
                ctx.lineWidth = lw * 3.2;
                ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
                ctx.strokeStyle = `hsla(${st.hue},100%,82%,${fade * 0.8})`;
                ctx.lineWidth = lw;
                ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
            }
            prev = p;
        }
    }

    let mx = -999, my = -999, gx = -999, gy = -999;
    if (finePointer) {
        window.addEventListener('pointermove', e => {
            const r = landing.getBoundingClientRect();
            mx = e.clientX - r.left; my = e.clientY - r.top;
            if (gx < -900) { gx = mx; gy = my; }
        }, { passive: true });
    }

    const AURORA = [
        [60, 255, 170], [170, 90, 255], [60, 200, 255]
    ];

    function draw(now, dt) {
        ctx.clearRect(0, 0, W, H);

        // drifting aurora light in the sky
        for (let i = 0; i < AURORA.length; i++) {
            const c = AURORA[i];
            const cx = W * (0.2 + 0.3 * i) + W * 0.2 * Math.sin(now * 0.00009 + i * 2.1);
            const cy = H * (0.2 + 0.05 * i) + H * 0.08 * Math.sin(now * 0.00012 + i);
            const rad = Math.max(W, H) * 0.42;
            const pulse = 0.17 + 0.08 * Math.sin(now * 0.0003 + i * 1.7);
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
            g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${pulse})`);
            g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H * 0.75);
        }

        // swaying aurora curtains (slow flowing bands of light)
        for (let i = 0; i < 6; i++) {
            const c = AURORA[i % 3];
            const x = W * ((i + 0.5) / 6) + W * 0.09 * Math.sin(now * 0.00008 + i * 1.4);
            const a = 0.10 + 0.07 * Math.sin(now * 0.00025 + i * 1.9);
            const r = W * 0.2;
            ctx.save();
            ctx.translate(x, H * 0.28);
            ctx.scale(0.32, 1.7 + 0.25 * Math.sin(now * 0.0001 + i));
            const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
            g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a})`);
            g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
            ctx.fillStyle = g;
            ctx.fillRect(-r, -r, r * 2, r * 2);
            ctx.restore();
        }

        // twinkling stars
        for (const st of stars) {
            const a = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(now * 0.001 * st.sp + st.ph));
            ctx.fillStyle = `rgba(220,240,255,${a})`;
            ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.283); ctx.fill();
        }

        // flowing river light
        for (const st of streaks) drawStreak(st, dt);

        // floating particles
        for (const m of motes) {
            m.x += m.vx * dt; m.y += m.vy * dt;
            if (m.y < -10) { m.y = H + 10; m.x = rand(0, W); }
            if (m.x < -10) m.x = W + 10; else if (m.x > W + 10) m.x = -10;
            const a = 0.2 + 0.35 * (0.5 + 0.5 * Math.sin(now * 0.0012 + m.ph));
            ctx.fillStyle = `hsla(${m.hue},100%,75%,${a})`;
            ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.283); ctx.fill();
        }

        // cursor-following light (desktop only)
        if (finePointer && mx > -900) {
            gx += (mx - gx) * 0.08; gy += (my - gy) * 0.08;
            const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 120);
            g.addColorStop(0, 'rgba(120,220,255,0.06)');
            g.addColorStop(1, 'rgba(120,220,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(gx - 120, gy - 120, 240, 240);
        }

        if (DEBUG) {
            ctx.strokeStyle = 'yellow'; ctx.lineWidth = 2;
            for (const l of LANES) {
                ctx.beginPath();
                l.path.forEach((p, i) => {
                    const x = p[0] * s + ox, y = p[1] * s + oy;
                    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
                });
                ctx.stroke();
            }
        }
    }

    let last = performance.now();
    let animationId = null;

    function frame(now) {
        animationId = null;

        if (document.hidden || reduceMotion) return;

        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        draw(now, dt);
        animationId = requestAnimationFrame(frame);
    }

    function startAnimation() {
        if (reduceMotion || document.hidden || animationId !== null) return;

        last = performance.now();
        animationId = requestAnimationFrame(frame);
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            if (animationId !== null) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        } else {
            startAnimation();
        }
    });


    resize();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(landing);
    else window.addEventListener('resize', resize);
    startAnimation();
})();

/* =====================================
   ENTER MY WORLD: PORTAL CONTROLLER
   ===================================== */
(() => {
    const enterButton = document.querySelector(".enter-button");
    const portal = document.getElementById("portalTransition");
    const progress = document.getElementById("portalProgress");

    if (!enterButton || !portal) return;

    let isEntering = false;
    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    // Change this if your button should open another page.
    const destination = enterButton.getAttribute("href") || "about.html";

    // Show loading only when navigation takes noticeable time.
    let progressTimer;

    function enterWorld(event) {
        if (isEntering) {
            event.preventDefault();
            return;
        }

        // Respect modified clicks and non-left mouse clicks.
        if (
            event.type === "click" &&
            (event.ctrlKey || event.metaKey || event.shiftKey ||
             event.altKey || event.button !== 0)
        ) {
            return;
        }

        event.preventDefault();
        isEntering = true;

        enterButton.setAttribute("aria-busy", "true");
        portal.setAttribute("aria-hidden", "false");
        portal.classList.add("active");

        if (reduceMotion) {
            window.location.href = destination;
            return;
        }

        // Stage 1: light wave begins immediately.
        // Stage 2: the wave expands and the screen darkens.
        window.setTimeout(() => {
            portal.classList.add("reveal");
        }, 650);

        // Stage 3: VC logo awakens.
        // Show progress only if we're still waiting.
        progressTimer = window.setTimeout(() => {
            if (progress) progress.classList.add("visible");
        }, 1700);

        // Stage 4: continue to the destination.
        window.setTimeout(() => {
            window.location.href = destination;
        }, 2450);
    }

    enterButton.addEventListener("click", enterWorld);
})();

/* ===== INITIAL HOMEPAGE LOADER CONTROLLER ===== */
(() => {
    const loader = document.getElementById("introLoader");

    if (!loader) return;

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    // Keep the intro brief and reveal the homepage.
    const displayTime = reduceMotion ? 150 : 1500;

    function hideLoader() {
        loader.classList.add("hide");

        // Remove it after the fade so it cannot block the page.
        window.setTimeout(() => {
            loader.remove();
        }, reduceMotion ? 50 : 750);
    }

    // Start the timer once the page has loaded.
    if (document.readyState === "complete") {
        window.setTimeout(hideLoader, displayTime);
    } else {
        window.addEventListener("load", () => {
            window.setTimeout(hideLoader, displayTime);
        }, { once: true });
    }

    // Safety fallback if loading takes unusually long.
    window.setTimeout(hideLoader, 5000);
})();
