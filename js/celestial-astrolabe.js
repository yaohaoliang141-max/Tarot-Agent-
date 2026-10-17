// ========================================================
// 神秘塔罗 Mystic Tarot · Celestial Astrolabe Space
// Contemporary Mysticism × Luxury Editorial 3D Experience
// Built with Three.js (Procedural Astrolabe & Celestial Physics)
// ========================================================

(function () {
    'use strict';

    if (typeof THREE === 'undefined') {
        console.warn('Three.js is not loaded. Celestial Astrolabe will not render.');
        return;
    }

    // ---- Color Palette (Luxury Champagne & Deep Cosmic Void) ----
    const COLORS = {
        bgDeep: 0x020106,
        goldPrimary: 0xc5a467,
        goldChampagne: 0xdfc58d,
        goldDark: 0x7a5e28,
        goldBronze: 0x4e3a18,
        ivoryWarm: 0xf5eedc,
        violetGlow: 0x160d2b,
        starWhite: 0xfffcf5,
        starWarm: 0xf7e2be,
        starViolet: 0xc4b5ed
    };

    // ---- Engine State ----
    const engine = {
        container: null,
        canvas: null,
        scene: null,
        camera: null,
        renderer: null,
        clock: new THREE.Clock(),

        // Mouse & Interaction
        mouse: { x: 0, y: 0, targetX: 0, targetY: 0, ndcX: 0, ndcY: 0 },
        scrollProgress: 0,
        targetScrollProgress: 0,
        isReducedMotion: false,
        isMobile: false,

        // State Machine: 'idle', 'aligning', 'divination'
        mode: 'idle',
        alignProgress: 0,

        // 3D Objects
        // Celestial 3D Nebula System (Authentic NASA/ESO Helix Nebula)
        nebulaGroup: null,
        nebulaCore: null,
        nebulaHalo: null,
        nebulaOuter: null,
        astrolabeGroup: null, // compatibility alias
        centralJewel: null,

        // Milky Way & Starfield Systems (Authentic ESO Real Photography System)
        milkyWayMesh: null,
        galaxyYaw: Math.PI * 0.45,
        galaxyPitch: 0.28,
        galaxyRoll: 0.22,
        targetGalaxyYaw: Math.PI * 0.45,
        targetGalaxyPitch: 0.28,
        isDraggingGalaxy: false,
        dragStartX: 0,
        dragStartY: 0,
        driftSpeed: 0.00045,
        starfield: null,
        starPositions: null,
        starOriginals: null,
        dustParticles: null,
        dustData: [],

        // Ripple & Constellation Resonance
        ripples: [],
        constellationLines: null,
        constellationTimer: 0
    };

    // ---- Initialization ----
    document.addEventListener('DOMContentLoaded', () => {
        initCelestialSpace();
    });

    function initCelestialSpace() {
        engine.canvas = document.getElementById('celestial-canvas');
        if (!engine.canvas) {
            engine.canvas = document.createElement('canvas');
            engine.canvas.id = 'celestial-canvas';
            engine.canvas.className = 'celestial-canvas';
            document.body.insertBefore(engine.canvas, document.body.firstChild);
        }

        // Reduced motion check
        const mediaReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        engine.isReducedMotion = mediaReduced.matches;
        mediaReduced.addEventListener('change', e => { engine.isReducedMotion = e.matches; });

        // Mobile check
        engine.isMobile = window.innerWidth <= 768;

        // Scene
        engine.scene = new THREE.Scene();
        engine.scene.fog = new THREE.FogExp2(COLORS.bgDeep, 0.012);

        // Camera
        const aspect = window.innerWidth / window.innerHeight;
        engine.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        updateCameraPosition();

        // Renderer
        const dpr = Math.min(window.devicePixelRatio || 1, engine.isMobile ? 1.5 : 2);
        engine.renderer = new THREE.WebGLRenderer({
            canvas: engine.canvas,
            antialias: !engine.isMobile,
            alpha: true,
            powerPreference: 'high-performance'
        });
        engine.renderer.setSize(window.innerWidth, window.innerHeight);
        engine.renderer.setPixelRatio(dpr);
        engine.renderer.setClearColor(COLORS.bgDeep, 1);

        // Build 3D Deep Space World
        createMilkyWayBackdrop();
        createSpatialStarfield();
        createCelestialNebula();
        createDustMotes();
        createConstellationSystem();

        // Bind Listeners
        bindEvents();

        // Start Render Loop
        requestAnimationFrame(renderLoop);

        // Expose API globally
        window.CelestialSpace = {
            triggerCosmicAlignment: triggerCosmicAlignment,
            setMode: setMode,
            engine: engine
        };
    }

    function updateCameraPosition() {
        if (!engine.camera) return;
        if (engine.isMobile) {
            engine.camera.position.set(0, 0, 9.8);
            engine.camera.fov = 48;
        } else {
            engine.camera.position.set(0, 0, 10.5);
            engine.camera.fov = 45;
        }
        engine.camera.updateProjectionMatrix();
    }

    // ========================================================
    // AUTHENTIC 3D HELIX NEBULA SYSTEM (真实欧洲南方天文台 ESO 螺旋星云 · 上帝之眼)
    // ========================================================
    function createCelestialNebula() {
        const root = new THREE.Group();
        engine.astrolabeGroup = root; // Keep reference for animation and mode transitions
        engine.nebulaGroup = root;

        // Position on the right side for desktop, upper aperture for mobile
        if (engine.isMobile) {
            root.position.set(0, 2.0, 0);
            root.scale.set(1.25, 1.25, 1.25);
        } else {
            root.position.set(2.8, 0.1, -0.4);
            root.scale.set(1.0, 1.0, 1.0);
        }

        // Initial Astronomical Tilts
        root.rotation.x = 0.22;
        root.rotation.y = -0.28;
        root.rotation.z = 0.08;

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('images/helix-nebula.png', function (tex) {
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.generateMipmaps = false;

            // 1. Primary Volumetric Core Disc (Authentic High-Res Helix Nebula)
            const coreGeo = new THREE.PlaneGeometry(6.6, 6.6);
            const coreMat = new THREE.MeshBasicMaterial({
                map: tex,
                transparent: true,
                opacity: 0.98,
                fog: false,
                depthWrite: false,
                side: THREE.DoubleSide
            });
            const coreMesh = new THREE.Mesh(coreGeo, coreMat);
            root.add(coreMesh);
            engine.nebulaCore = coreMesh;

            // 2. Secondary Luminous Ethereal Filament Layer (Diffused Gas Shell with Additive Glow)
            const haloGeo = new THREE.PlaneGeometry(8.2, 8.2);
            const haloMat = new THREE.MeshBasicMaterial({
                map: tex,
                transparent: true,
                opacity: 0.58,
                blending: THREE.AdditiveBlending,
                fog: false,
                depthWrite: false,
                side: THREE.DoubleSide
            });
            const haloMesh = new THREE.Mesh(haloGeo, haloMat);
            haloMesh.position.z = -0.15;
            root.add(haloMesh);
            engine.nebulaHalo = haloMesh;

            // 3. Tertiary Outer Stellar Ejection Halo
            const outerGeo = new THREE.PlaneGeometry(9.6, 9.6);
            const outerMat = new THREE.MeshBasicMaterial({
                map: tex,
                transparent: true,
                opacity: 0.22,
                blending: THREE.AdditiveBlending,
                fog: false,
                depthWrite: false,
                side: THREE.DoubleSide
            });
            const outerMesh = new THREE.Mesh(outerGeo, outerMat);
            outerMesh.position.z = -0.3;
            root.add(outerMesh);
            engine.nebulaOuter = outerMesh;

            // 4. Central Pulsar / Stellar Core (Radiant Pulsing Diamond at the Eye Center)
            const jewelGeo = new THREE.CircleGeometry(0.24, 32);
            const jewelMat = new THREE.MeshBasicMaterial({
                map: createStarlightTexture(),
                color: COLORS.starWhite,
                transparent: true,
                opacity: 0.95,
                fog: false,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });
            const jewel = new THREE.Mesh(jewelGeo, jewelMat);
            jewel.position.z = 0.08;
            root.add(jewel);
            engine.centralJewel = jewel;
        }, undefined, function (err) {
            console.warn('Nebula texture load error:', err);
        });

        engine.scene.add(root);
    }

    // ========================================================
    // AUTHENTIC MILKY WAY GALAXY SYSTEM (真实欧洲南方天文台 ESO 银河系天球全景)
    // ========================================================
    function createMilkyWayBackdrop() {
        // 1. Inverted Celestial Sky Sphere surrounding the whole 3D world (ESO GigaGalaxy 360)
        const sphereRadius = 96;
        const sphereGeo = new THREE.SphereGeometry(sphereRadius, 64, 40);

        // Procedural deep-space gradient canvas for instant fallback while 1.4MB JPG finishes loading
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = 512;
        fallbackCanvas.height = 256;
        const fbCtx = fallbackCanvas.getContext('2d');
        const grad = fbCtx.createRadialGradient(256, 128, 10, 256, 128, 250);
        grad.addColorStop(0, '#1c1236');
        grad.addColorStop(0.4, '#100a22');
        grad.addColorStop(0.8, '#06030e');
        grad.addColorStop(1, '#020106');
        fbCtx.fillStyle = grad;
        fbCtx.fillRect(0, 0, 512, 256);
        const fallbackTexture = new THREE.CanvasTexture(fallbackCanvas);

        // Material MUST specify fog: false so exponential scene fog does NOT black out the galaxy!
        const sphereMat = new THREE.MeshBasicMaterial({
            map: fallbackTexture,
            color: 0xffffff,
            side: THREE.BackSide,
            fog: false,
            depthWrite: false,
            transparent: true,
            opacity: 0.96
        });

        const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);

        // Position the luminous galactic core (Sagittarius region) toward the upper-right (behind Astrolabe)
        sphereMesh.rotation.x = engine.galaxyPitch;
        sphereMesh.rotation.y = engine.galaxyYaw;
        sphereMesh.rotation.z = engine.galaxyRoll;

        engine.scene.add(sphereMesh);
        engine.milkyWayMesh = sphereMesh;

        // 2. Load authentic ESO / Serge Brunier GigaGalaxy 360 real panoramic photograph
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('images/milkyway-galaxy.jpg', function (tex) {
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.generateMipmaps = false;
            if (typeof THREE.sRGBEncoding !== 'undefined') {
                tex.encoding = THREE.sRGBEncoding;
            }
            if (typeof THREE.SRGBColorSpace !== 'undefined') {
                tex.colorSpace = THREE.SRGBColorSpace;
            }
            sphereMat.map = tex;
            sphereMat.needsUpdate = true;
        }, undefined, function (err) {
            console.warn('Real Milky Way texture load issue:', err);
        });
    }

    // Helper: Circular Soft Starlight Sprite Generator (eliminates default square quad artifacts)
    function createStarlightTexture() {
        const cv = document.createElement('canvas');
        cv.width = 32;
        cv.height = 32;
        const ctx = cv.getContext('2d');
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 15);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.25, 'rgba(250, 235, 205, 0.85)');
        grad.addColorStop(0.65, 'rgba(212, 175, 55, 0.25)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
        return new THREE.CanvasTexture(cv);
    }

    // ========================================================
    // SPATIAL STARFIELD (深空纤细星芒 - 柔和微光星宿)
    // ========================================================
    function createSpatialStarfield() {
        const count = engine.isMobile ? 90 : 160;
        const positions = new Float32Array(count * 3);
        const originalPositions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const cWhite = new THREE.Color(COLORS.starWhite);
        const cWarm = new THREE.Color(COLORS.starWarm);
        const cViolet = new THREE.Color(COLORS.starViolet);

        for (let i = 0; i < count; i++) {
            const idx = i * 3;
            // Distribute in deep space background behind astrolabe
            const x = (Math.random() - 0.5) * 44;
            const y = (Math.random() - 0.5) * 30;
            const z = -55 + Math.random() * 30; // Strictly distant (-55 to -25)

            positions[idx] = x;
            positions[idx + 1] = y;
            positions[idx + 2] = z;

            originalPositions[idx] = x;
            originalPositions[idx + 1] = y;
            originalPositions[idx + 2] = z;

            const randColor = Math.random();
            let c = cWhite;
            if (randColor < 0.45) c = cWarm;
            else if (randColor > 0.82) c = cViolet;

            colors[idx] = c.r;
            colors[idx + 1] = c.g;
            colors[idx + 2] = c.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Use circular starlight texture to completely eliminate square quad artifacts
        const starMat = new THREE.PointsMaterial({
            map: createStarlightTexture(),
            size: 0.9,
            vertexColors: true,
            transparent: true,
            opacity: 0.65,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        const points = new THREE.Points(geo, starMat);
        engine.scene.add(points);

        engine.starfield = points;
        engine.starPositions = positions;
        engine.starOriginals = originalPositions;
    }

    // ========================================================
    // FOREGROUND DUST MOTES (柔和微光浮尘)
    // ========================================================
    function createDustMotes() {
        const count = engine.isMobile ? 12 : 24;
        const pos = new Float32Array(count * 3);
        const geo = new THREE.BufferGeometry();
        engine.dustData = [];

        for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const x = (Math.random() - 0.5) * 16;
            const y = (Math.random() - 0.5) * 10;
            const z = 1.0 + Math.random() * 4.0;

            pos[idx] = x;
            pos[idx + 1] = y;
            pos[idx + 2] = z;

            engine.dustData.push({
                baseX: x, baseY: y, baseZ: z,
                vx: 0, vy: 0,
                speed: 0.0015 + Math.random() * 0.003,
                wobble: Math.random() * Math.PI * 2
            });
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            map: createStarlightTexture(),
            color: COLORS.goldChampagne,
            size: 0.65,
            transparent: true,
            opacity: 0.35,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        const dust = new THREE.Points(geo, mat);
        engine.scene.add(dust);
        engine.dustParticles = dust;
    }

    // ========================================================
    // CONSTELLATION & RIPPLE RESONANCE (点击波纹与星座共鸣)
    // ========================================================
    function createConstellationSystem() {
        const maxLines = 40;
        const linePositions = new Float32Array(maxLines * 6);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

        const mat = new THREE.LineBasicMaterial({
            color: COLORS.goldChampagne,
            transparent: true,
            opacity: 0.0
        });

        const lineSegments = new THREE.LineSegments(geo, mat);
        engine.scene.add(lineSegments);
        engine.constellationLines = lineSegments;
    }

    function triggerClickResonance(screenX, screenY) {
        // Map 2D click to 3D Plane
        const ndcX = (screenX / window.innerWidth) * 2 - 1;
        const ndcY = -(screenY / window.innerHeight) * 2 + 1;

        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), engine.camera);

        const targetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const hitPoint = new THREE.Vector3();
        ray.ray.intersectPlane(targetPlane, hitPoint);

        // 1. Create Delicate Expanding Golden Ripple
        const rippleRing = createHairlineCircle(0.1, new THREE.LineBasicMaterial({
            color: COLORS.goldChampagne,
            transparent: true,
            opacity: 0.95
        }), 64);
        rippleRing.position.copy(hitPoint);
        engine.scene.add(rippleRing);

        engine.ripples.push({
            mesh: rippleRing,
            radius: 0.1,
            maxRadius: 4.8,
            opacity: 0.95
        });

        // 2. Weave Constellation Connections to Nearest Stars
        if (engine.starPositions && engine.constellationLines) {
            const linePos = engine.constellationLines.geometry.attributes.position.array;
            let lineIdx = 0;
            const maxConnections = 12;
            const matchedStars = [];

            const totalStars = engine.starPositions.length / 3;
            for (let i = 0; i < totalStars; i++) {
                const sx = engine.starPositions[i * 3];
                const sy = engine.starPositions[i * 3 + 1];
                const sz = engine.starPositions[i * 3 + 2];

                // Screen-space proximity
                const dist = Math.hypot(sx - hitPoint.x, sy - hitPoint.y);
                if (dist < 4.2 && sz > -30) {
                    matchedStars.push(new THREE.Vector3(sx, sy, sz));
                    if (matchedStars.length >= 8) break;
                }
            }

            // Interconnect neighboring stars with geometric lines
            for (let i = 0; i < matchedStars.length; i++) {
                for (let j = i + 1; j < matchedStars.length; j++) {
                    if (lineIdx >= maxConnections * 6) break;
                    const p1 = matchedStars[i];
                    const p2 = matchedStars[j];
                    if (p1.distanceTo(p2) < 3.8) {
                        linePos[lineIdx++] = p1.x;
                        linePos[lineIdx++] = p1.y;
                        linePos[lineIdx++] = p1.z;
                        linePos[lineIdx++] = p2.x;
                        linePos[lineIdx++] = p2.y;
                        linePos[lineIdx++] = p2.z;
                    }
                }
            }

            // Pad unused lines
            while (lineIdx < linePos.length) {
                linePos[lineIdx++] = 0;
            }

            engine.constellationLines.geometry.attributes.position.needsUpdate = true;
            engine.constellationLines.material.opacity = 0.85;
            engine.constellationTimer = 1.0;
        }
    }

    // ========================================================
    // COSMIC ALIGNMENT TRANSITION (开始占卜时的星仪聚合反应)
    // ========================================================
    function triggerCosmicAlignment(callback) {
        if (engine.mode === 'aligning') return;
        engine.mode = 'aligning';
        engine.alignProgress = 0;

        const startTime = performance.now();
        const duration = 1200; // ms

        function step(now) {
            const elapsed = now - startTime;
            const p = Math.min(1.0, elapsed / duration);
            engine.alignProgress = p;

            if (p < 1.0) {
                requestAnimationFrame(step);
            } else {
                engine.mode = 'divination';
                if (typeof callback === 'function') callback();
            }
        }
        requestAnimationFrame(step);
    }

    function setMode(newMode) {
        engine.mode = newMode;
    }

    // ========================================================
    // MAIN RENDER LOOP & PHYSICS SIMULATION
    // ========================================================
    function renderLoop() {
        requestAnimationFrame(renderLoop);

        const delta = engine.clock.getDelta();
        const time = engine.clock.getElapsedTime();

        // 1. Mouse Damping Interpolation (阻尼平滑插值)
        const lerpFactor = engine.isReducedMotion ? 0.01 : 0.045;
        engine.mouse.x += (engine.mouse.targetX - engine.mouse.x) * lerpFactor;
        engine.mouse.y += (engine.mouse.targetY - engine.mouse.y) * lerpFactor;

        // Scroll Interpolation
        engine.scrollProgress += (engine.targetScrollProgress - engine.scrollProgress) * 0.05;

        // Continuous Natural Cosmic Drift (clearly visible slow galactic rotation)
        if (!engine.isDraggingGalaxy) {
            engine.targetGalaxyYaw -= engine.driftSpeed;
        }

        // Smooth Galaxy Interpolation
        engine.galaxyYaw += (engine.targetGalaxyYaw - engine.galaxyYaw) * 0.08;
        engine.galaxyPitch += (engine.targetGalaxyPitch - engine.galaxyPitch) * 0.08;

        // Authentic Milky Way Celestial Sphere Motion (Real Cosmic Parallax & Drag Orbit)
        if (engine.milkyWayMesh) {
            const mouseTiltX = -engine.mouse.y * 0.12;
            const mouseTiltY = engine.mouse.x * 0.14;
            engine.milkyWayMesh.rotation.x = engine.galaxyPitch + mouseTiltX;
            engine.milkyWayMesh.rotation.y = engine.galaxyYaw + mouseTiltY;
            engine.milkyWayMesh.rotation.z = engine.galaxyRoll + (engine.scrollProgress * 0.35);
        }

        // 2. 3D Celestial Nebula Rotation, Swirl & Parallax
        if (engine.astrolabeGroup) {
            const neb = engine.astrolabeGroup;

            if (engine.mode === 'idle') {
                // Differential Swirling Nebula Gas Layers
                if (engine.nebulaCore) engine.nebulaCore.rotation.z += 0.0006;
                if (engine.nebulaHalo) engine.nebulaHalo.rotation.z -= 0.0004;
                if (engine.nebulaOuter) engine.nebulaOuter.rotation.z += 0.0002;

                // Central Core Breathing Pulse
                if (engine.centralJewel) {
                    const pulse = 1.0 + Math.sin(time * 1.5) * 0.28;
                    engine.centralJewel.scale.set(pulse, pulse, pulse);
                }

                // Subtle organic cosmic wobble
                const wobbleX = Math.sin(time * 0.35) * 0.03;
                const wobbleY = Math.cos(time * 0.28) * 0.03;

                // 3D Spatial Tilt driven by Mouse (鼠标空间倾斜)
                neb.rotation.x = 0.22 + wobbleX + (-engine.mouse.y * 0.32);
                neb.rotation.y = -0.28 + wobbleY + (engine.mouse.x * 0.42);
                neb.rotation.z = (time * 0.015) + (engine.mouse.x * 0.12) + (engine.scrollProgress * 0.8);

                // Spatial Parallax Offset
                const targetBaseX = engine.isMobile ? 0 : 2.8;
                const targetBaseY = engine.isMobile ? 2.0 : 0.1;
                neb.position.x = targetBaseX + (engine.mouse.x * 0.35) - (engine.scrollProgress * 0.9);
                neb.position.y = targetBaseY + (engine.mouse.y * 0.3) + (engine.scrollProgress * 0.4);

            } else if (engine.mode === 'aligning') {
                // Cosmic Gathering & Gravitational Compression Transition
                const ease = Math.sin((engine.alignProgress * Math.PI) / 2);
                if (engine.nebulaCore) engine.nebulaCore.rotation.z += 0.06 * (1 - ease * 0.7);
                if (engine.nebulaHalo) engine.nebulaHalo.rotation.z -= 0.04 * (1 - ease * 0.7);

                const currentScale = (engine.isMobile ? 0.72 : 1.0) * (1.0 + ease * 0.2);
                neb.scale.set(currentScale, currentScale, currentScale);

                if (engine.centralJewel) {
                    const flare = 1.0 + Math.sin(engine.alignProgress * Math.PI * 4) * 1.4;
                    engine.centralJewel.scale.set(flare, flare, flare);
                }

            } else if (engine.mode === 'divination') {
                if (engine.nebulaCore) engine.nebulaCore.rotation.z += 0.0003;
                if (engine.nebulaHalo) engine.nebulaHalo.rotation.z -= 0.0002;

                neb.rotation.x = 0.18 + (-engine.mouse.y * 0.12);
                neb.rotation.y = -0.22 + (engine.mouse.x * 0.18);
            }
        }

        // 3. Deep Starfield Parallax & Cosmic Pull
        if (engine.starfield && engine.starPositions && engine.starOriginals) {
            const pos = engine.starPositions;
            const orig = engine.starOriginals;
            const total = pos.length / 3;

            const pullStrength = (engine.mode === 'aligning') ? (engine.alignProgress * 0.65) : 0;

            for (let i = 0; i < total; i++) {
                const idx = i * 3;
                // Idle gentle drift
                const ox = orig[idx];
                const oy = orig[idx + 1];
                const oz = orig[idx + 2];

                // Mouse parallax: deeper stars move less (scale inversely with depth)
                const depthFactor = (oz + 80) / 100;
                const px = ox - (engine.mouse.x * depthFactor * 1.8);
                const py = oy - (engine.mouse.y * depthFactor * 1.5);

                // Gravitational pull toward astrolabe center when aligning
                if (pullStrength > 0) {
                    pos[idx] += (px * (1 - pullStrength) - pos[idx]) * 0.1;
                    pos[idx + 1] += (py * (1 - pullStrength) - pos[idx + 1]) * 0.1;
                } else {
                    pos[idx] = px;
                    pos[idx + 1] = py;
                }
            }
            engine.starfield.geometry.attributes.position.needsUpdate = true;
        }


        // 4. Foreground Dust Particles & Mouse Repulsion
        if (engine.dustParticles && engine.dustData.length) {
            const pos = engine.dustParticles.geometry.attributes.position.array;
            const mouseWorldX = engine.mouse.x * 8.0;
            const mouseWorldY = engine.mouse.y * 5.0;

            for (let i = 0; i < engine.dustData.length; i++) {
                const d = engine.dustData[i];
                const idx = i * 3;

                // Drift motion
                d.wobble += d.speed;
                const targetX = d.baseX + Math.sin(d.wobble) * 0.6;
                const targetY = d.baseY + Math.cos(d.wobble * 0.8) * 0.6;

                // Proximity repulsion from mouse
                const dx = pos[idx] - mouseWorldX;
                const dy = pos[idx + 1] - mouseWorldY;
                const dist = Math.hypot(dx, dy);

                if (dist < 2.5 && !engine.isReducedMotion) {
                    const force = (2.5 - dist) * 0.02;
                    d.vx += (dx / dist) * force;
                    d.vy += (dy / dist) * force;
                }

                // Apply velocity with damping
                d.vx *= 0.92;
                d.vy *= 0.92;

                pos[idx] += (targetX + d.vx - pos[idx]) * 0.05;
                pos[idx + 1] += (targetY + d.vy - pos[idx + 1]) * 0.05;
            }
            engine.dustParticles.geometry.attributes.position.needsUpdate = true;
        }

        // 5. Click Ripples Update
        for (let r = engine.ripples.length - 1; r >= 0; r--) {
            const rip = engine.ripples[r];
            rip.radius += (rip.maxRadius - rip.radius) * 0.065;
            rip.opacity *= 0.94;

            rip.mesh.scale.set(rip.radius, rip.radius, 1);
            rip.mesh.material.opacity = rip.opacity;

            if (rip.opacity < 0.02) {
                engine.scene.remove(rip.mesh);
                rip.mesh.geometry.dispose();
                rip.mesh.material.dispose();
                engine.ripples.splice(r, 1);
            }
        }

        // 6. Constellation Lines Decay
        if (engine.constellationTimer > 0) {
            engine.constellationTimer -= delta * 0.65;
            if (engine.constellationLines) {
                engine.constellationLines.material.opacity = Math.max(0, engine.constellationTimer * 0.8);
            }
        }

        // Render Frame
        engine.renderer.render(engine.scene, engine.camera);
    }

    // ========================================================
    // EVENT LISTENERS & RESIZE (响应式与视口控制)
    // ========================================================
    function bindEvents() {
        let isPointerDown = false;
        let dragDistance = 0;

        // Pointer Down (Mouse & Touch) - Initiate 360° Milky Way Drag
        window.addEventListener('pointerdown', e => {
            const target = e.target;
            if (target.closest('button') || target.closest('input') || target.closest('textarea') ||
                target.closest('select') || target.closest('a') || target.closest('.modal-content') ||
                target.closest('.nav-brand') || target.closest('.nav-links') ||
                target.closest('.spread-card') || target.closest('.tarot-card') ||
                target.closest('.setting-group') || target.closest('.api-settings-modal')) {
                return;
            }

            isPointerDown = true;
            dragDistance = 0;
            engine.isDraggingGalaxy = true;
            engine.dragStartX = e.clientX;
            engine.dragStartY = e.clientY;
            document.body.classList.add('cosmos-drag-active');
        });

        // Pointer Move - 3D Tilt Parallax & 360° Galaxy Orbit
        window.addEventListener('pointermove', e => {
            engine.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
            engine.mouse.targetY = (e.clientY / window.innerHeight) * 2 - 1;
            engine.mouse.ndcX = e.clientX;
            engine.mouse.ndcY = e.clientY;

            if (engine.isDraggingGalaxy) {
                const dx = e.clientX - engine.dragStartX;
                const dy = e.clientY - engine.dragStartY;
                dragDistance += Math.abs(dx) + Math.abs(dy);

                const sensitivity = engine.isMobile ? 0.005 : 0.0035;
                engine.targetGalaxyYaw += dx * sensitivity;
                engine.targetGalaxyPitch += dy * sensitivity;

                // Clamp pitch to avoid gimbal flip
                engine.targetGalaxyPitch = Math.max(-1.3, Math.min(1.3, engine.targetGalaxyPitch));

                engine.dragStartX = e.clientX;
                engine.dragStartY = e.clientY;
            }
        }, { passive: true });

        // Pointer Up - Release Drag & Trigger Stellar Resonance on Click
        window.addEventListener('pointerup', e => {
            if (isPointerDown && dragDistance < 10) {
                const target = e.target;
                if (!target.closest('button') && !target.closest('input') && !target.closest('textarea') &&
                    !target.closest('select') && !target.closest('a') && !target.closest('.modal-content') &&
                    !target.closest('.nav-brand') && !target.closest('.nav-links') &&
                    !target.closest('.spread-card') && !target.closest('.tarot-card')) {
                    triggerClickResonance(e.clientX, e.clientY);
                }
            }
            isPointerDown = false;
            engine.isDraggingGalaxy = false;
            document.body.classList.remove('cosmos-drag-active');
        });

        window.addEventListener('pointercancel', () => {
            isPointerDown = false;
            engine.isDraggingGalaxy = false;
            document.body.classList.remove('cosmos-drag-active');
        });

        // Double Click to Reset Celestial View
        window.addEventListener('dblclick', e => {
            const target = e.target;
            if (target.closest('button') || target.closest('input') || target.closest('a')) return;
            engine.targetGalaxyYaw = Math.PI * 0.45;
            engine.targetGalaxyPitch = 0.28;
        });

        // Scroll
        window.addEventListener('scroll', () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            if (maxScroll > 0) {
                engine.targetScrollProgress = Math.min(1.0, Math.max(0, window.scrollY / maxScroll));
            }
        }, { passive: true });

        // Resize
        window.addEventListener('resize', onResize);
    }

    function onResize() {
        engine.isMobile = window.innerWidth <= 768;
        if (!engine.renderer || !engine.camera) return;

        engine.camera.aspect = window.innerWidth / window.innerHeight;
        updateCameraPosition();

        if (engine.astrolabeGroup) {
            if (engine.isMobile) {
                engine.astrolabeGroup.position.set(0, 2.0, 0);
                engine.astrolabeGroup.scale.set(1.25, 1.25, 1.25);
            } else {
                engine.astrolabeGroup.position.set(2.8, 0.1, -0.4);
                engine.astrolabeGroup.scale.set(1.0, 1.0, 1.0);
            }
        }

        const dpr = Math.min(window.devicePixelRatio || 1, engine.isMobile ? 1.5 : 2);
        engine.renderer.setSize(window.innerWidth, window.innerHeight);
        engine.renderer.setPixelRatio(dpr);
    }

})();
