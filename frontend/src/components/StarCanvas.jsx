import { useEffect, useRef } from 'react';

export default function StarCanvas() {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, stars, shootingStars, nebulae;

    // ─────────────────────────────────────────────────────────────────────
    // NEBULA CLOUDS — painted once to an offscreen canvas, composited cheaply
    // ─────────────────────────────────────────────────────────────────────
    let nebulaCanvas = null;

    function buildNebula() {
      nebulaCanvas = document.createElement('canvas');
      nebulaCanvas.width  = W;
      nebulaCanvas.height = H;
      const nc = nebulaCanvas.getContext('2d');

      const blobs = [
        // [cx%, cy%, rx, ry, color, alpha]
        [0.15, 0.25, W*0.28, H*0.22, '80,20,180',  0.09],
        [0.82, 0.18, W*0.22, H*0.18, '60,10,160',  0.07],
        [0.50, 0.72, W*0.35, H*0.20, '100,30,200', 0.06],
        [0.08, 0.65, W*0.18, H*0.28, '50,10,150',  0.07],
        [0.90, 0.60, W*0.20, H*0.22, '70,20,170',  0.07],
        [0.35, 0.40, W*0.15, H*0.18, '120,40,220', 0.05],
        [0.65, 0.85, W*0.25, H*0.15, '90,25,190',  0.05],
        // subtle blue-ish tints for variety
        [0.75, 0.40, W*0.18, H*0.20, '30,60,200',  0.04],
        [0.20, 0.80, W*0.20, H*0.16, '40,20,180',  0.04],
      ];

      blobs.forEach(([cx, cy, rx, ry, rgb, a]) => {
        const grd = nc.createRadialGradient(cx*W, cy*H, 0, cx*W, cy*H, Math.max(rx, ry));
        grd.addColorStop(0,   `rgba(${rgb},${a})`);
        grd.addColorStop(0.5, `rgba(${rgb},${a * 0.4})`);
        grd.addColorStop(1,   'rgba(0,0,0,0)');
        nc.save();
        nc.translate(cx*W, cy*H);
        nc.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
        nc.translate(-cx*W, -cy*H);
        nc.fillStyle = grd;
        nc.beginPath();
        nc.arc(cx*W, cy*H, Math.max(rx, ry), 0, Math.PI * 2);
        nc.fill();
        nc.restore();
      });
    }

    // ─────────────────────────────────────────────────────────────────────
    // STARS — 3 depth layers for parallax feel
    // ─────────────────────────────────────────────────────────────────────
    function buildStars() {
      stars = [];

      // Far layer — tiny, slow twinkle (most dense, creates depth)
      for (let i = 0; i < 800; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 0.55 + 0.1,
          minA: 0.05 + Math.random() * 0.1,
          maxA: 0.35 + Math.random() * 0.35,
          speed: Math.random() * 0.25 + 0.08,
          phase: Math.random() * Math.PI * 2,
          layer: 0, type: 'dot',
        });
      }

      // Mid layer — medium stars, moderate twinkle
      for (let i = 0; i < 280; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 0.9 + 0.45,
          minA: 0.2 + Math.random() * 0.15,
          maxA: 0.7 + Math.random() * 0.3,
          speed: Math.random() * 0.5 + 0.18,
          phase: Math.random() * Math.PI * 2,
          layer: 1, type: 'dot',
        });
      }

      // Near layer — bigger, fast vivid twinkle
      for (let i = 0; i < 80; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.1 + 0.8,
          minA: 0.4 + Math.random() * 0.2,
          maxA: 0.9 + Math.random() * 0.1,
          speed: Math.random() * 0.9 + 0.4,
          phase: Math.random() * Math.PI * 2,
          layer: 2, type: 'dot',
        });
      }

      // Bright white glowing stars
      for (let i = 0; i < 60; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.5 + 1.0,
          minA: 0.25, maxA: 1.0,
          speed: Math.random() * 0.8 + 0.3,
          phase: Math.random() * Math.PI * 2,
          type: 'glow', purple: false,
        });
      }

      // Purple glowing stars
      for (let i = 0; i < 42; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.6 + 0.9,
          minA: 0.2, maxA: 1.0,
          speed: Math.random() * 0.7 + 0.25,
          phase: Math.random() * Math.PI * 2,
          type: 'glow', purple: true,
        });
      }

      // Sparkle cross stars
      for (let i = 0; i < 26; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 2.0 + 1.8,
          minA: 0.15, maxA: 1.0,
          speed: Math.random() * 1.0 + 0.4,
          phase: Math.random() * Math.PI * 2,
          rot: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.014,
          type: 'sparkle', purple: Math.random() < 0.4,
        });
      }

      // Large soft orb glows
      for (let i = 0; i < 14; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 3.5 + 3,
          minA: 0.05, maxA: 0.4,
          speed: Math.random() * 0.2 + 0.06,
          phase: Math.random() * Math.PI * 2,
          type: 'orb', purple: Math.random() < 0.6,
        });
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // SHOOTING STARS
    // ─────────────────────────────────────────────────────────────────────
    function buildShootingStars() {
      shootingStars = [];
    }

    function spawnShootingStar() {
      // angle between -20° and +20° from horizontal (left→right feel)
      const angle = (Math.random() * 40 - 20) * Math.PI / 180;
      const speed = Math.random() * 9 + 7;
      // start from top or left edge randomly
      const fromTop = Math.random() < 0.6;
      const x = fromTop ? Math.random() * W : -60;
      const y = fromTop ? -60 : Math.random() * H * 0.5;
      shootingStars.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + (fromTop ? speed * 0.4 : 0),
        len: Math.random() * 160 + 80,
        alpha: 0,
        life: 0,
        maxLife: Math.random() * 60 + 50,  // frames
        purple: Math.random() < 0.3,
      });
    }

    // ─────────────────────────────────────────────────────────────────────
    // DRAW HELPERS
    // ─────────────────────────────────────────────────────────────────────
    function drawDot(s, a) {
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawGlow(s, a) {
      const hR = s.r * 6;
      const halo = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, hR);
      if (s.purple) {
        halo.addColorStop(0,   `rgba(200,120,255,${a * 0.65})`);
        halo.addColorStop(0.45,`rgba(139,70,220,${a * 0.25})`);
        halo.addColorStop(1,   'rgba(0,0,0,0)');
      } else {
        halo.addColorStop(0,   `rgba(220,205,255,${a * 0.6})`);
        halo.addColorStop(0.45,`rgba(180,160,255,${a * 0.22})`);
        halo.addColorStop(1,   'rgba(0,0,0,0)');
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(s.x, s.y, hR, 0, Math.PI * 2);
      ctx.fill();

      const core = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 1.6);
      core.addColorStop(0, s.purple ? `rgba(230,170,255,${a})` : `rgba(255,255,255,${a})`);
      core.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawSparkle(s, a) {
      drawGlow(s, a * 0.75);
      const len = s.r * 6;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      for (let k = 0; k < 2; k++) {
        const g = ctx.createLinearGradient(-len, 0, len, 0);
        const c = s.purple ? `rgba(210,140,255,${a})` : `rgba(255,255,255,${a})`;
        g.addColorStop(0,   'rgba(0,0,0,0)');
        g.addColorStop(0.5, c);
        g.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = s.r * 0.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(-len, 0);
        ctx.lineTo(len, 0);
        ctx.stroke();
        ctx.rotate(Math.PI / 2);
      }
      ctx.restore();
    }

    function drawOrb(s, a) {
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 10);
      if (s.purple) {
        g.addColorStop(0,    `rgba(168,85,247,${a})`);
        g.addColorStop(0.38, `rgba(109,40,217,${a * 0.35})`);
        g.addColorStop(1,    'rgba(0,0,0,0)');
      } else {
        g.addColorStop(0,    `rgba(255,255,255,${a})`);
        g.addColorStop(0.38, `rgba(200,180,255,${a * 0.3})`);
        g.addColorStop(1,    'rgba(0,0,0,0)');
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 10, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawShootingStar(ss) {
      const tailX = ss.x - ss.vx * (ss.len / ss.speed || 14);
      const tailY = ss.y - ss.vy * (ss.len / ss.speed || 14);
      const g = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
      const col = ss.purple ? `rgba(210,150,255,${ss.alpha})` : `rgba(255,255,255,${ss.alpha})`;
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.6, ss.purple ? `rgba(180,100,255,${ss.alpha * 0.4})` : `rgba(200,180,255,${ss.alpha * 0.3})`);
      g.addColorStop(1, col);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = g;
      ctx.lineWidth = ss.purple ? 1.8 : 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(ss.x, ss.y);
      ctx.stroke();

      // bright tip glow
      const tip = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 5);
      tip.addColorStop(0, ss.purple ? `rgba(220,160,255,${ss.alpha})` : `rgba(255,255,255,${ss.alpha})`);
      tip.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = tip;
      ctx.beginPath();
      ctx.arc(ss.x, ss.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // ─────────────────────────────────────────────────────────────────────
    // ANIMATION LOOP
    // ─────────────────────────────────────────────────────────────────────
    let t = 0;
    let shootingStarTimer = 0;
    const SHOOT_INTERVAL = 140; // frames between shooting stars (~2.3s)

    function render() {
      frameRef.current = requestAnimationFrame(render);
      t += 0.016;
      shootingStarTimer++;

      ctx.clearRect(0, 0, W, H);

      // 1. Nebula (offscreen canvas, one drawImage call)
      if (nebulaCanvas) {
        ctx.globalAlpha = 1;
        ctx.drawImage(nebulaCanvas, 0, 0);
      }

      // 2. Stars
      for (const s of stars) {
        const raw  = Math.sin(t * s.speed * Math.PI * 2 + s.phase);
        const norm = (raw + 1) / 2;
        const a    = s.minA + norm * (s.maxA - s.minA);

        if (s.type === 'sparkle') s.rot += s.rotSpeed;

        switch (s.type) {
          case 'dot':     drawDot(s, a);     break;
          case 'glow':    drawGlow(s, a);    break;
          case 'sparkle': drawSparkle(s, a); break;
          case 'orb':     drawOrb(s, a);     break;
        }
      }

      // 3. Shooting stars
      if (shootingStarTimer >= SHOOT_INTERVAL) {
        spawnShootingStar();
        shootingStarTimer = 0;
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life++;
        ss.x += ss.vx;
        ss.y += ss.vy;

        // fade in first 20% of life, fade out last 30%
        const pct = ss.life / ss.maxLife;
        if (pct < 0.2)      ss.alpha = pct / 0.2;
        else if (pct > 0.7) ss.alpha = 1 - (pct - 0.7) / 0.3;
        else                 ss.alpha = 1.0;

        drawShootingStar(ss);

        if (ss.life >= ss.maxLife || ss.x > W + 100 || ss.y > H + 100) {
          shootingStars.splice(i, 1);
        }
      }

      ctx.globalAlpha = 1;
    }

    // ─────────────────────────────────────────────────────────────────────
    // RESIZE
    // ─────────────────────────────────────────────────────────────────────
    function init() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      buildNebula();
      buildStars();
      buildShootingStars();
    }

    init();
    render();
    window.addEventListener('resize', init);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', init);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', display: 'block' }}
    />
  );
}