(() => {
    "use strict";
    if (document.getElementById("lafHomeJump") || document.querySelector("[data-home-link]")) return;

    const scriptURL = document.currentScript?.src || window.location.href;
    const homeURL = new URL("index.html", scriptURL);
    if (window.location.pathname === homeURL.pathname) return;

    const style = document.createElement("style");
    style.textContent = `
        #lafHomeJump {
            position: fixed; left: 14px; bottom: calc(16px + env(safe-area-inset-bottom));
            z-index: 8000; display: inline-flex; align-items: center; justify-content: center;
            gap: 8px; min-height: 46px; padding: 11px 17px; border: 1px solid #8c6b1d;
            border-radius: 999px; background: #17140ded; color: #f0d484; font-family: system-ui, sans-serif;
            font-size: 14px; font-weight: 700; text-decoration: none; box-shadow: 0 8px 28px #0008;
            backdrop-filter: blur(12px);
        }
        #lafHomeJump:active { transform: scale(.97); }
    `;

    const link = document.createElement("a");
    link.id = "lafHomeJump";
    link.href = homeURL.href;
    link.textContent = "⌂ হোমে ফিরুন";

    document.head.append(style);
    document.body.append(link);
})();
