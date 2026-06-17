(function () {
  let bgAudio = null;
  let bgButton = null;
  let context = null;
  let unlockHandler = null;
  let bgVolume = document.body?.dataset.page === "music" ? 0.12 : 0.35;
  let bgSaveTimer = null;
  const bgStateKey = "nuoBgMusic";
  const bgTimeKey = "nuoBgMusicTime";

  function getContext() {
    if (!context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      context = new AudioContextClass();
    }
    if (context.state === "suspended") context.resume();
    return context;
  }

  function initBackground(options = {}) {
    const button = document.querySelector(".audio-toggle");
    if (!button) return;
    const autoResume = options.autoResume !== false;
    bgButton = button;
    bgAudio = new Audio(NuoRouter.asset("assets/audio/bg-nuo.mp3"));
    bgAudio.loop = true;
    bgAudio.volume = bgVolume;
    bgAudio.preload = "auto";
    bgAudio.addEventListener("loadedmetadata", restoreBackgroundTime, { once: true });
    bgAudio.addEventListener("timeupdate", saveBackgroundTime);
    window.addEventListener("pagehide", saveBackgroundTime);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") saveBackgroundTime();
    });

    const saved = localStorage.getItem(bgStateKey);
    if (saved !== "paused" && autoResume) {
      playBackground(button).then((didPlay) => {
        if (!didPlay) addAutoplayUnlock(button);
      });
    }

    button.addEventListener("click", () => {
      if (bgAudio.paused) {
        removeAutoplayUnlock();
        playBackground(button).then((didPlay) => {
          if (!didPlay) playTone(168, 0.18);
        });
      } else {
        saveBackgroundTime();
        bgAudio.pause();
        stopBackgroundSaveTimer();
        localStorage.setItem(bgStateKey, "paused");
        setButtonState(button, false);
      }
    });
  }

  function setButtonState(button, isPlaying) {
    button.classList.toggle("is-playing", isPlaying);
    button.setAttribute("aria-pressed", String(isPlaying));
  }

  function playBackground(button = bgButton, options = {}) {
    if (!bgAudio) return Promise.resolve(false);
    if (options.fromStart) {
      resetBackgroundTime();
    } else {
      restoreBackgroundTime();
    }
    return bgAudio.play().then(() => {
      localStorage.setItem(bgStateKey, "playing");
      setButtonState(button, true);
      startBackgroundSaveTimer();
      removeAutoplayUnlock();
      return true;
    }).catch(() => false);
  }

  function playBackgroundFromStart() {
    if (!bgAudio) initBackground({ autoResume: false });
    localStorage.setItem(bgStateKey, "playing");
    return playBackground(bgButton, { fromStart: true }).then((didPlay) => {
      if (!didPlay) addAutoplayUnlock(bgButton, { fromStart: true });
      return didPlay;
    });
  }

  function addAutoplayUnlock(button, playOptions = {}) {
    if (unlockHandler) return;
    unlockHandler = (event) => {
      if (localStorage.getItem(bgStateKey) === "paused") {
        removeAutoplayUnlock();
        return;
      }
      if (event.target?.closest?.(".audio-toggle")) return;
      playBackground(button, playOptions);
    };
    document.addEventListener("pointerdown", unlockHandler, { passive: true });
    document.addEventListener("keydown", unlockHandler);
    document.addEventListener("touchstart", unlockHandler, { passive: true });
  }

  function removeAutoplayUnlock() {
    if (!unlockHandler) return;
    document.removeEventListener("pointerdown", unlockHandler);
    document.removeEventListener("keydown", unlockHandler);
    document.removeEventListener("touchstart", unlockHandler);
    unlockHandler = null;
  }

  function playTone(frequency = 220, duration = 0.28, type = "sine") {
    const ctx = getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }

  function playNoise(duration = 0.2) {
    const ctx = getContext();
    if (!ctx) return;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = "bandpass";
    filter.frequency.value = 1200;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  function setBackgroundVolume(volume = 0.35) {
    bgVolume = Math.max(0, Math.min(1, Number(volume) || 0));
    if (bgAudio) bgAudio.volume = bgVolume;
  }

  function restoreBackgroundTime() {
    if (!bgAudio || !Number.isFinite(bgAudio.duration) || bgAudio.duration <= 0) return;
    const savedTime = Number(localStorage.getItem(bgTimeKey));
    if (!Number.isFinite(savedTime) || savedTime <= 0) return;
    const loopedTime = savedTime % bgAudio.duration;
    if (Math.abs(bgAudio.currentTime - loopedTime) > 0.75) {
      try {
        bgAudio.currentTime = loopedTime;
      } catch {}
    }
  }

  function saveBackgroundTime() {
    if (!bgAudio || !Number.isFinite(bgAudio.currentTime)) return;
    localStorage.setItem(bgTimeKey, String(bgAudio.currentTime));
  }

  function resetBackgroundTime() {
    if (!bgAudio) return;
    try {
      bgAudio.currentTime = 0;
    } catch {}
    localStorage.setItem(bgTimeKey, "0");
  }

  function startBackgroundSaveTimer() {
    if (bgSaveTimer) return;
    bgSaveTimer = window.setInterval(saveBackgroundTime, 500);
  }

  function stopBackgroundSaveTimer() {
    if (!bgSaveTimer) return;
    window.clearInterval(bgSaveTimer);
    bgSaveTimer = null;
  }

  window.NuoAudio = { initBackground, playBackgroundFromStart, playTone, playNoise, getContext, setBackgroundVolume };
})();
