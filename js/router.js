(function () {
  function root() {
    return document.body.dataset.root || ".";
  }

  function path(pathname) {
    const base = root();
    if (base === ".") return pathname;
    return `${base}/${pathname}`;
  }

  function asset(assetPath) {
    return path(assetPath);
  }

  function go(pathname) {
    window.location.href = path(pathname);
  }

  function initNav() {
    const current = document.body.dataset.page;
    document.querySelectorAll("[data-route]").forEach((link) => {
      if (link.dataset.route === current) link.classList.add("is-active");
    });
  }

  window.NuoRouter = { root, path, asset, go, initNav };
})();
