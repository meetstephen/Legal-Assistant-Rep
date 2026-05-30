// Applies the saved theme before paint to avoid a flash. Defaults to dark.
// Kept as an external file so the Content-Security-Policy can forbid inline
// scripts (script-src 'self').
(function () {
  try {
    var t = localStorage.getItem('lexi2:theme');
    var dark = t === null ? true : JSON.parse(t);
    if (dark) document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    document.documentElement.style.backgroundColor = dark ? '#020617' : '#faf8f5';
  } catch {
    /* ignore */
  }
})();
