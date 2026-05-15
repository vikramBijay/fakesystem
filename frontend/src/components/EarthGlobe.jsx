import { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';

export default function EarthGlobe({ style = {}, size = 700, speed = 0.0012, geoData }) {
  const mountRef = useRef(null);
  const frameRef = useRef(null);
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0.3, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });

  // Pre-compute random altitudes once — prevents per-frame re-randomization
  const altitudes = useMemo(() => {
    if (!geoData) return null;
    return geoData.features.map(() => 0.018 + Math.random() * 0.028);
  }, [geoData]);

  // Pre-compute random colors once
  const colors = useMemo(() => {
    if (!geoData) return null;
    return geoData.features.map(() => {
      const roll = Math.random();
      if (roll < 0.25) return `hsl(270, 85%, 55%)`;
      if (roll < 0.60) return `hsl(268, 75%, 35%)`;
      return `hsl(265, 65%, 20%)`;
    });
  }, [geoData]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !geoData || !altitudes || !colors) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
    camera.position.z = 280;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    // Cap pixel ratio at 1.5 instead of 2 — big GPU saving on retina screens
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    mount.appendChild(renderer.domElement);

    // ── Stars — reduced from 4000 to 1200 ────────────────────────────────
    const STAR_COUNT = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      starPos[i * 3]     = (Math.random() - 0.5) * 6000;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 6000;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 6000;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMesh = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.9, transparent: true, opacity: 0.9,
      sizeAttenuation: true,
    }));
    scene.add(starMesh);

    // ── Globe — use memoized altitudes & colors ───────────────────────────
    let altIdx = 0, colIdx = 0;
    const globe = new ThreeGlobe()
      .hexPolygonsData(geoData.features)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.15)
      .hexPolygonAltitude(() => altitudes[altIdx++ % altitudes.length])
      .showAtmosphere(false)
      .globeMaterial(
        new THREE.MeshPhongMaterial({
          color: new THREE.Color(0x000000),
          transparent: true,
          opacity: 0.5,
        })
      )
      .hexPolygonColor(() => colors[colIdx++ % colors.length]);

    scene.add(globe);

    // ── Lights ────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 3.0);
    sun.position.set(-180, 120, 220);
    scene.add(sun);
    const blueLight = new THREE.PointLight(0xaa44ff, 2.0, 900);
    blueLight.position.set(100, -100, 200);
    scene.add(blueLight);

    // ── Animate ───────────────────────────────────────────────────────────
    let t = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      t += 0.01;

      if (!isDragging.current) {
        velocity.current.y = velocity.current.y * 0.96 + speed * 0.04;
        velocity.current.x *= 0.94;
        rotation.current.y += velocity.current.y;
        rotation.current.x += velocity.current.x;
        rotation.current.x = Math.max(-0.6, Math.min(0.6, rotation.current.x));
      }

      globe.rotation.y = rotation.current.y;
      globe.rotation.x = rotation.current.x;
      blueLight.intensity = 2.2 + Math.sin(t * 0.5 + 1) * 0.4;
      // Slow down star rotation — was 0.00015, small saving
      starMesh.rotation.y += 0.0001;

      renderer.render(scene, camera);
    };
    animate();

    // ── Mouse / Touch drag ────────────────────────────────────────────────
    const onDown = (x, y) => { isDragging.current = true; prevMouse.current = { x, y }; velocity.current = { x: 0, y: 0 }; };
    const onMove = (x, y) => {
      if (!isDragging.current) return;
      const dx = x - prevMouse.current.x, dy = y - prevMouse.current.y;
      velocity.current.y = dx * 0.005; velocity.current.x = dy * 0.003;
      rotation.current.y += velocity.current.y;
      rotation.current.x = Math.max(-0.6, Math.min(0.6, rotation.current.x + velocity.current.x));
      prevMouse.current = { x, y };
    };
    const onUp = () => { isDragging.current = false; };

    const md = e => onDown(e.clientX, e.clientY);
    const mm = e => onMove(e.clientX, e.clientY);
    const ts = e => onDown(e.touches[0].clientX, e.touches[0].clientY);
    const tm = e => { onMove(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); };

    renderer.domElement.addEventListener('mousedown', md);
    renderer.domElement.addEventListener('mousemove', mm);
    renderer.domElement.addEventListener('mouseup', onUp);
    renderer.domElement.addEventListener('mouseleave', onUp);
    renderer.domElement.addEventListener('touchstart', ts);
    renderer.domElement.addEventListener('touchmove', tm, { passive: false });
    renderer.domElement.addEventListener('touchend', onUp);
    renderer.domElement.style.cursor = 'grab';

    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.domElement.removeEventListener('mousedown', md);
      renderer.domElement.removeEventListener('mousemove', mm);
      renderer.domElement.removeEventListener('mouseup', onUp);
      renderer.domElement.removeEventListener('mouseleave', onUp);
      renderer.domElement.removeEventListener('touchstart', ts);
      renderer.domElement.removeEventListener('touchmove', tm);
      renderer.domElement.removeEventListener('touchend', onUp);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      starGeo.dispose();
    };
  }, [size, speed, geoData, altitudes, colors]);

  return (
    <div
      ref={mountRef}
      style={{ width: size, height: size, pointerEvents: 'auto', flexShrink: 0, ...style }}
    />
  );
}