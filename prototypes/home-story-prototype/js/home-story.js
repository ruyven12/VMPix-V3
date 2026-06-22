(function () {
  const root = document.documentElement;

  function setViewportHeight() {
    const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    root.style.setProperty('--app-viewport-height', `${height}px`);
  }

  setViewportHeight();
  window.addEventListener('resize', setViewportHeight, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setViewportHeight, { passive: true });
  }
})();