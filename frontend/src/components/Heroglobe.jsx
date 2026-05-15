import { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';

export default function HeroGlobe({ geoData }) {
  const mountRef = useRef(null);
  const frameRef = useRef(null);
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const rotY = useRef(0);
  const rotX = useRef(0.15);
  const velX = useRef(0);
  const velY = useRef(0);

  // Pre-compute random values once — avoids per-frame randomization
  const altitudes = useMemo(() => {
    if (!geoData) return null;
    return geoData.features.map(() => 0.018 + Math.random() * 0.028);
  }, [geoData]);

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

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 10000);
    camera.position.z = 290;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    // Cap at 1.5 — saves GPU work on hi-DPI screens
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    mount.appendChild(renderer.domElement);

    let altIdx = 0, colIdx = 0;
    const globe = new ThreeGlobe()
      .hexPolygonsData(geoData.features)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.15)
      .hexPolygonAltitude(() => altitudes[altIdx++ % altitudes.length])
      .showAtmosphere(false)
      .globeMaterial(new THREE.MeshPhongMaterial({
        color: new THREE.Color(0x000000),
        transparent: true,
        opacity: 0.5,
      }))
      .hexPolygonColor(() => colors[colIdx++ % colors.length]);

    scene.add(globe);

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 3.0);
    sun.position.set(-180, 120, 220);
    scene.add(sun);
    const purpleLight = new THREE.PointLight(0xaa44ff, 2.0, 900);
    purpleLight.position.set(100, -100, 200);
    scene.add(purpleLight);

    let t = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      t += 0.01;
      if (!isDragging.current) {
        velY.current = velY.current * 0.96 + 0.0012 * 0.04;
        velX.current *= 0.94;
        rotY.current += velY.current;
        rotX.current += velX.current;
        rotX.current = Math.max(-0.4, Math.min(0.4, rotX.current));
      }
      globe.rotation.y = rotY.current;
      globe.rotation.x = rotX.current;
      purpleLight.intensity = 1.8 + Math.sin(t * 0.5) * 0.4;
      renderer.render(scene, camera);
    };
    animate();

    const onDown = (x, y) => { isDragging.current = true; prevMouse.current = { x, y }; velX.current = 0; velY.current = 0; };
    const onMove = (x, y) => {
      if (!isDragging.current) return;
      velY.current = (x - prevMouse.current.x) * 0.005;
      velX.current = (y - prevMouse.current.y) * 0.003;
      rotY.current += velY.current;
      rotX.current = Math.max(-0.4, Math.min(0.4, rotX.current + velX.current));
      prevMouse.current = { x, y };
    };
    const onUp = () => { isDragging.current = false; };

    renderer.domElement.addEventListener('mousedown', e => onDown(e.clientX, e.clientY));
    renderer.domElement.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    renderer.domElement.addEventListener('mouseup', onUp);
    renderer.domElement.addEventListener('mouseleave', onUp);
    renderer.domElement.addEventListener('touchstart', e => onDown(e.touches[0].clientX, e.touches[0].clientY));
    renderer.domElement.addEventListener('touchmove', e => { onMove(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }, { passive: false });
    renderer.domElement.addEventListener('touchend', onUp);
    renderer.domElement.style.cursor = 'grab';

    return () => {
      cancelAnimationFrame(frameRef.current);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [geoData, altitudes, colors]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}