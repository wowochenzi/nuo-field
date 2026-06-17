(function initThreeSensesEntry() {
  'use strict';

  const ENTRY_KEY = 'nuoOriginToThreeSenses';
  const ENTRY_CLASS = 'is-origin-entry';
  const PLAYING_CLASS = 'is-origin-entry-playing';

  function startEntry() {
    let shouldPlay = false;

    try {
      shouldPlay = sessionStorage.getItem(ENTRY_KEY) === '1';
      sessionStorage.removeItem(ENTRY_KEY);
    } catch (error) {
      shouldPlay = false;
    }

    if (!shouldPlay) return;

    const body = document.body;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    body.classList.add(ENTRY_CLASS, PLAYING_CLASS);

    window.setTimeout(() => {
      body.classList.remove(PLAYING_CLASS);
    }, reducedMotion ? 80 : 5200);
  }

  startEntry();
})();
