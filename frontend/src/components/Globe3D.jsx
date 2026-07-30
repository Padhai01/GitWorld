import React, { useRef, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';

const TIER_SIZES = {
    hamlet: 0.04,
    village: 0.07,
    city_state: 0.11,
    kingdom: 0.16,
    empire: 0.22,
    superpower: 0.32,
};

export default function Globe3D({ users = [], onSelectUser, selectedUser, style = {} }) {
    const mountRef = useRef(null);
    const sceneRef = useRef({});
    const [hoveredUser, setHoveredUser] = useState(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const W = mount.clientWidth, H = mount.clientHeight;

        // ── Renderer ─────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        mount.appendChild(renderer.domElement);

        // ── Scene ────────────────────────────────────────────
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
        camera.position.set(0, 0, 2.8);

        // ── Globe ────────────────────────────────────────────
        const globeGeo = new THREE.SphereGeometry(1, 64, 64);
        const globeMat = new THREE.MeshPhongMaterial({
            color: 0x0a1628,
            emissive: 0x020810,
            specular: 0x4a8fa8,
            shininess: 30,
            transparent: true,
            opacity: 0.95,
        });
        const globe = new THREE.Mesh(globeGeo, globeMat);
        scene.add(globe);

        // Atmosphere glow
        const atmGeo = new THREE.SphereGeometry(1.05, 32, 32);
        const atmMat = new THREE.MeshPhongMaterial({
            color: 0x00e5ff,
            transparent: true, opacity: 0.06,
            side: THREE.BackSide,
        });
        scene.add(new THREE.Mesh(atmGeo, atmMat));

        // Grid lines
        const gridMat = new THREE.LineBasicMaterial({ color: 0x1a2d4a, transparent: true, opacity: 0.4 });
        for (let lat = -80; lat <= 80; lat += 20) {
            const pts = [];
            for (let lon = 0; lon <= 360; lon += 3) {
                const phi = (90 - lat) * (Math.PI / 180);
                const theta = lon * (Math.PI / 180);
                pts.push(new THREE.Vector3(
                    1.01 * Math.sin(phi) * Math.cos(theta),
                    1.01 * Math.cos(phi),
                    1.01 * Math.sin(phi) * Math.sin(theta)
                ));
            }
            scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
        }
        for (let lon = 0; lon < 360; lon += 30) {
            const pts = [];
            for (let lat = -90; lat <= 90; lat += 3) {
                const phi = (90 - lat) * (Math.PI / 180);
                const theta = lon * (Math.PI / 180);
                pts.push(new THREE.Vector3(
                    1.01 * Math.sin(phi) * Math.cos(theta),
                    1.01 * Math.cos(phi),
                    1.01 * Math.sin(phi) * Math.sin(theta)
                ));
            }
            scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
        }

        // ── Territory patches ─────────────────────────────────
        const territoryGroup = new THREE.Group();
        scene.add(territoryGroup);

        const territories = [];
        users.forEach(user => {
            const color = new THREE.Color(user.territory_color || '#4a8fa8');
            const size = TIER_SIZES[user.tier] || 0.06;

            const lon = user.territory_x || 0;
            const lat = user.territory_y || 0;
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = lon * (Math.PI / 180);

            const patchGeo = new THREE.SphereGeometry(size, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
            const patchMat = new THREE.MeshPhongMaterial({
                color,
                emissive: color,
                emissiveIntensity: 0.4,
                transparent: true,
                opacity: 0.75,
                side: THREE.DoubleSide,
            });
            const patch = new THREE.Mesh(patchGeo, patchMat);

            const r = 1.001;
            patch.position.set(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.cos(phi),
                r * Math.sin(phi) * Math.sin(theta)
            );
            patch.lookAt(0, 0, 0);
            patch.rotateX(Math.PI / 2);
            patch.userData = { user, originalColor: color.clone() };
            territories.push(patch);
            territoryGroup.add(patch);

            // Marker dot
            const dotGeo = new THREE.SphereGeometry(0.012, 8, 8);
            const dotMat = new THREE.MeshBasicMaterial({ color });
            const dot = new THREE.Mesh(dotGeo, dotMat);
            const dr = 1.02;
            dot.position.set(
                dr * Math.sin(phi) * Math.cos(theta),
                dr * Math.cos(phi),
                dr * Math.sin(phi) * Math.sin(theta)
            );
            territoryGroup.add(dot);
        });

        // ── Lights ───────────────────────────────────────────
        scene.add(new THREE.AmbientLight(0x334466, 0.8));
        const sun = new THREE.DirectionalLight(0x88ccff, 1.2);
        sun.position.set(5, 3, 5);
        scene.add(sun);

        // ── Mouse / drag ─────────────────────────────────────
        let isDragging = false, prevX = 0, prevY = 0;
        let rotX = 0, rotY = 0, velX = 0, velY = 0;
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onMouseDown = (e) => {
            isDragging = true;
            prevX = e.clientX; prevY = e.clientY;
            velX = 0; velY = 0;
        };
        const onMouseMove = (e) => {
            if (isDragging) {
                const dx = e.clientX - prevX;
                const dy = e.clientY - prevY;
                rotY += dx * 0.005;
                rotX += dy * 0.005;
                rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
                velX = dy * 0.005; velY = dx * 0.005;
                prevX = e.clientX; prevY = e.clientY;
            } else {
                const rect = mount.getBoundingClientRect();
                mouse.x = ((e.clientX - rect.left) / W) * 2 - 1;
                mouse.y = -((e.clientY - rect.top) / H) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);
                const hits = raycaster.intersectObjects(territories);
                if (hits.length > 0) {
                    const u = hits[0].object.userData.user;
                    setHoveredUser(u);
                    mount.style.cursor = 'pointer';
                } else {
                    setHoveredUser(null);
                    mount.style.cursor = 'grab';
                }
            }
        };
        const onMouseUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            // Click detection (barely moved)
            const dx = e.clientX - prevX, dy = e.clientY - prevY;
            if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
                const rect = mount.getBoundingClientRect();
                mouse.x = ((e.clientX - rect.left) / W) * 2 - 1;
                mouse.y = -((e.clientY - rect.top) / H) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);
                const hits = raycaster.intersectObjects(territories);
                if (hits.length > 0 && onSelectUser) {
                    onSelectUser(hits[0].object.userData.user);
                }
            }
        };

        mount.addEventListener('mousedown', onMouseDown);
        mount.addEventListener('mousemove', onMouseMove);
        mount.addEventListener('mouseup', onMouseUp);
        mount.style.cursor = 'grab';

        // Touch support
        let lastTouchX = 0, lastTouchY = 0;
        mount.addEventListener('touchstart', e => {
            lastTouchX = e.touches[0].clientX;
            lastTouchY = e.touches[0].clientY;
        });
        mount.addEventListener('touchmove', e => {
            const dx = e.touches[0].clientX - lastTouchX;
            const dy = e.touches[0].clientY - lastTouchY;
            rotY += dx * 0.005; rotX += dy * 0.005;
            rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
            lastTouchX = e.touches[0].clientX;
            lastTouchY = e.touches[0].clientY;
        });

        // ── Animate ──────────────────────────────────────────
        let animId;
        const animate = () => {
            animId = requestAnimationFrame(animate);
            if (!isDragging) {
                rotY += 0.001;      // auto-spin
                velX *= 0.95; velY *= 0.95;
                rotX += velX; rotY += velY;
            }
            globe.rotation.y = rotY;
            globe.rotation.x = rotX;
            territoryGroup.rotation.y = rotY;
            territoryGroup.rotation.x = rotX;

            // Highlight selected/hovered
            territories.forEach(t => {
                const isSelected = selectedUser?.id === t.userData.user?.id;
                const isHovered = hoveredUser?.id === t.userData.user?.id;
                t.material.emissiveIntensity = isSelected ? 0.9 : isHovered ? 0.65 : 0.4;
                t.material.opacity = isSelected ? 1 : isHovered ? 0.9 : 0.75;
            });

            renderer.render(scene, camera);
        };
        animate();

        // Resize
        const onResize = () => {
            const w = mount.clientWidth, h = mount.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        sceneRef.current = { renderer, scene, camera, territories, globe, territoryGroup };

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', onResize);
            mount.removeEventListener('mousedown', onMouseDown);
            mount.removeEventListener('mousemove', onMouseMove);
            mount.removeEventListener('mouseup', onMouseUp);
            renderer.dispose();
            if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
        };
    }, [users]);  // eslint-disable-line

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

            {/* HUD */}
            <div style={{
                position: 'absolute', bottom: 16, left: 16,
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.65rem', color: 'rgba(74,143,168,0.6)',
                letterSpacing: '0.15em',
                pointerEvents: 'none',
            }}>
                GITWORLD GLOBE v1.0 · {users.length} TERRITORIES · DRAG TO ROTATE
            </div>

            {/* Hover tooltip */}
            {hoveredUser && (
                <div style={{
                    position: 'absolute', top: 16, right: 16,
                    background: 'rgba(6,13,24,0.95)',
                    border: `1px solid ${hoveredUser.territory_color || '#4a8fa8'}`,
                    padding: '0.75rem 1rem',
                    fontFamily: "'Rajdhani', sans-serif",
                    minWidth: 200,
                    animation: 'fadeIn 0.15s ease',
                    boxShadow: `0 0 20px ${hoveredUser.territory_color}44`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: hoveredUser.territory_color,
                            boxShadow: `0 0 8px ${hoveredUser.territory_color}`,
                        }} />
                        <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>@{hoveredUser.username}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
                        <div>★ {(hoveredUser.total_stars || 0).toLocaleString()} stars</div>
                        <div style={{ color: 'var(--frost)', fontSize: '0.7rem', marginTop: 2 }}>
                            {hoveredUser.tier?.replace('_', '-').toUpperCase()} · {hoveredUser.territory_name}
                        </div>
                    </div>
                    <div style={{ color: 'rgba(109,200,224,0.5)', fontSize: '0.6rem', marginTop: '0.4rem', fontFamily: "'Share Tech Mono'" }}>
                        Click to view profile
                    </div>
                </div>
            )}
        </div>
    );
}