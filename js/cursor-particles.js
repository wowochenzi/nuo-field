(function () {
  function init() {
    const canvas = document.getElementById("particleCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const dust = [];
    const trail = [];
    let ratio = 1;

    function resize() {
      ratio = Math.min(window.devicePixelRatio || 1, 1.6);
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      dust.length = 0;
      const count = window.innerWidth > 980 ? 160 : 90;
      for (let i = 0; i < count; i += 1) {
        dust.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: -0.08 - Math.random() * 0.18,
          vy: 0.02 + Math.random() * 0.08,
          r: 0.7 + Math.random() * 1.8,
          a: 0.18 + Math.random() * 0.42
        });
      }
    }

    window.addEventListener("pointermove", (event) => {
      for (let i = 0; i < 8; i += 1) {
        trail.push({
          x: event.clientX + (Math.random() - 0.5) * 10,
          y: event.clientY + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 1.8,
          vy: (Math.random() - 0.5) * 1.8 + 0.2,
          life: 1,
          r: 1 + Math.random() * 2.2
        });
      }
      if (trail.length > 260) trail.splice(0, trail.length - 260);
    }, { passive: true });

    function drawParticle(p, alpha) {
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
      gradient.addColorStop(0, `rgba(255, 246, 221, ${alpha * 0.88})`);
      gradient.addColorStop(0.38, `rgba(240, 209, 138, ${alpha * 0.34})`);
      gradient.addColorStop(0.72, `rgba(233, 111, 74, ${alpha * 0.08})`);
      gradient.addColorStop(1, "rgba(240, 209, 138, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    function tick() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = "lighter";
      dust.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20 || p.y > window.innerHeight + 20) {
          p.x = window.innerWidth + Math.random() * 60;
          p.y = Math.random() * window.innerHeight;
        }
        drawParticle(p, p.a);
      });
      for (let i = trail.length - 1; i >= 0; i -= 1) {
        const p = trail[i];
        p.life -= 0.022;
        if (p.life <= 0) {
          trail.splice(i, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        drawParticle(p, p.life * 0.58);
      }
      requestAnimationFrame(tick);
    }

    window.addEventListener("resize", resize);
    resize();
    tick();
  }

  window.NuoParticles = { init };
})();
