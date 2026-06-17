(function () {
  const keys = [
    "selectedMask",
    "completedOrigin",
    "completedChooseMask",
    "completedCraft",
    "completedWear",
    "completedGestureIds",
    "completedGestures",
    "completedInstruments",
    "completedMusic"
  ];

  function get(key, fallback = null) {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return raw;
    }
  }

  function set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function markComplete(key) {
    set(key, true);
  }

  function getSelectedMask() {
    const saved = get("selectedMask");
    if (saved && saved.id) {
      const current = window.NuoData.maskData.find((mask) => mask.id === saved.id);
      return current ? { ...saved, ...current } : saved;
    }
    return window.NuoData.maskData[0];
  }

  function setSelectedMask(mask) {
    return set("selectedMask", {
      id: mask.id,
      name: mask.name,
      region: mask.region,
      image: mask.image,
      model: mask.model,
      role: mask.role,
      meaning: mask.meaning,
      description: mask.description,
      source: mask.source
    });
  }

  function resetJourney() {
    keys.forEach((key) => localStorage.removeItem(key));
  }

  window.NuoState = { get, set, markComplete, getSelectedMask, setSelectedMask, resetJourney, keys };
})();
