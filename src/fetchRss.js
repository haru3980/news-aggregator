@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

:root {
  --board-bg: #0e1013;
  --tile-bg: #1a1d22;
  --tile-bg-alt: #1d2025;
  --flap-text: #f3efe4;
  --muted: #8b8d92;
  --amber: #e8a33d;
  --line: rgba(243, 239, 228, 0.08);
  --focus: #e8a33d;

  --jp: #d1495b;
  --us: #3d6fb4;
  --cn: #d1a72b;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background: var(--board-bg);
  color: var(--flap-text);
  font-family: 'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace;
}

button {
  font-family: inherit;
}

:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
