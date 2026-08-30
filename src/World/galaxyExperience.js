import * as THREE from 'three';

export function initGalaxyExperience({ mountNode = document.body, onReturnToLobby = null } = {}) {
    const root = mountNode;
    if (!root) return;

    const mount = document.createElement('div');
    mount.style.position = 'fixed';
    mount.style.inset = '0';
    mount.style.width = '100vw';
    mount.style.height = '100vh';
    mount.style.overflow = 'hidden';
    mount.style.background = '#000';
    mount.style.fontFamily = "'Courier New', Courier, monospace";
    mount.style.zIndex = '100';
    root.appendChild(mount);

    const style = document.createElement('style');
    style.textContent = `
        .galaxy-scene-canvas {
            display: block;
            width: 100vw;
            height: 100vh;
        }

        .galaxy-scene-overlay {
            position: absolute;
            inset: 0;
            background-image: url('/assets/nave_nbackground.png');
            background-size: cover;
            background-position: center;
            pointer-events: none;
            z-index: 5;
        }

        .galaxy-scene-hud {
            position: absolute;
            top: 20px;
            left: 20px;
            color: rgba(255, 100, 100, 0.9);
            font-size: 14px;
            pointer-events: none;
            text-shadow: 0 0 8px red;
            z-index: 10;
            white-space: pre-line;
        }

        .galaxy-scene-whiteout {
            position: absolute;
            inset: 0;
            background-color: white;
            opacity: 0;
            pointer-events: none;
            z-index: 20;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: opacity 2s ease-in-out;
        }

        .galaxy-scene-message {
            color: black;
            font-size: 2rem;
            font-weight: bold;
            opacity: 0;
            transition: opacity 1s 2s ease-in;
        }
    `;
    mount.appendChild(style);

    const hud = document.createElement('div');
    hud.className = 'galaxy-scene-hud';
    hud.innerHTML = 'SISTEMA DE NAVEGACIÓN ACTIVO<br>DESTINO: NÚCLEO GALÁCTICO<br>ESTADO: ATRAVESANDO VÓRTICE...';
    mount.appendChild(hud);

    const whiteout = document.createElement('div');
    whiteout.className = 'galaxy-scene-whiteout';

    const message = document.createElement('div');
    message.className = 'galaxy-scene-message';
    message.textContent = 'AQUÍ INICIA TU SIGUIENTE EVENTO';
    whiteout.appendChild(message);
    mount.appendChild(whiteout);

    const overlay = document.createElement('div');
    overlay.className = 'galaxy-scene-overlay';
    mount.appendChild(overlay);

    const btnVolver = document.createElement('button');
    btnVolver.textContent = 'VOLVER AL PASILLO';
    btnVolver.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        pointer-events: auto;
        z-index: 30;
        padding: 12px 24px;
        font-family: 'Courier New', Courier, monospace;
        font-weight: bold;
        background: rgba(10, 0, 20, 0.8);
        color: #00d2ff;
        border: 2px solid #00d2ff;
        border-radius: 20px;
        cursor: pointer;
        box-shadow: 0 0 15px rgba(0, 210, 255, 0.4);
    `;
    btnVolver.addEventListener('click', () => {
        if (onReturnToLobby) onReturnToLobby();
    });
    mount.appendChild(btnVolver);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1a0000, 0.0035);

    const camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        8000
    );
    camera.rotation.order = 'YXZ';
    camera.position.set(0, 0, 0);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.className = 'galaxy-scene-canvas';
    mount.appendChild(renderer.domElement);

    function createRedTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.2, 'rgba(255, 200, 200, 0.8)');
        grad.addColorStop(0.5, 'rgba(100, 0, 0, 0.4)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    }

    function createGlowTexture() {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0.0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.15, 'rgba(255,255,255,0.9)');
        grad.addColorStop(0.4, 'rgba(255,255,255,0.25)');
        grad.addColorStop(1.0, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    const redTexture = createRedTexture();
    const glowTexture = createGlowTexture();

    const redParticlesCount = 25000;
    const redGeometry = new THREE.BufferGeometry();
    const redPositions = new Float32Array(redParticlesCount * 3);
    for (let i = 0; i < redParticlesCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 20 + Math.random() * 50;
        redPositions[i * 3] = Math.cos(angle) * radius;
        redPositions[i * 3 + 1] = Math.sin(angle) * radius;
        redPositions[i * 3 + 2] = -Math.random() * 800;
    }
    redGeometry.setAttribute('position', new THREE.BufferAttribute(redPositions, 3));
    const redMaterial = new THREE.PointsMaterial({
        color: 0xff3333,
        size: 2.2,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        map: redTexture,
    });
    const redParticleSystem = new THREE.Points(redGeometry, redMaterial);
    scene.add(redParticleSystem);

    const galaxyGroup = new THREE.Group();
    const SCALE = 80;

    const colorCore = new THREE.Color('#ffffff');
    const colorInner = new THREE.Color('#bfe4ff');
    const colorMid = new THREE.Color('#5fa8e0');
    const colorOuter = new THREE.Color('#1c4f82');
    const colorGold = new THREE.Color('#e8c07d');

    function galaxyColor(t) {
        if (t < 0.12) return colorCore.clone().lerp(colorInner, t / 0.12);
        if (t < 0.5) return colorInner.clone().lerp(colorMid, (t - 0.12) / 0.38);
        return colorMid.clone().lerp(colorOuter, (t - 0.5) / 0.5);
    }

    function buildSpiralDisk({ count, radius, branches, spin, randomness, randomnessPower, sizeBase, goldChance }) {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const t = Math.pow(Math.random(), 1.6);
            const r = t * radius;
            const branchAngle = (i % branches) / branches * Math.PI * 2;
            const spinAngle = r * spin;
            const randPow = () => Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? -1 : 1);
            const rx = randPow() * randomness * (0.3 + r / radius);
            const ry = randPow() * randomness * 0.15 * (0.4 + (1 - r / radius));
            const rz = randPow() * randomness * (0.3 + r / radius);
            const angle = branchAngle + spinAngle;

            positions[i3] = (Math.cos(angle) * r + rx) * SCALE;
            positions[i3 + 1] = ry * SCALE;
            positions[i3 + 2] = (Math.sin(angle) * r + rz) * SCALE;

            let c = galaxyColor(r / radius);
            if (Math.random() < goldChance) c = colorGold.clone();
            colors[i3] = c.r;
            colors[i3 + 1] = c.g;
            colors[i3 + 2] = c.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const mat = new THREE.PointsMaterial({
            size: sizeBase * SCALE,
            map: glowTexture,
            vertexColors: true,
            transparent: true,
            alphaTest: 0.001,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
        });

        return new THREE.Points(geo, mat);
    }

    const mainDisk = buildSpiralDisk({
        count: 45000,
        radius: 5,
        branches: 5,
        spin: 2.2,
        randomness: 0.5,
        randomnessPower: 3,
        sizeBase: 0.09,
        goldChance: 0.06,
    });
    galaxyGroup.add(mainDisk);

    function buildOuterRing({ count, radiusMin, radiusMax, spin, size, opacity }) {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const r = radiusMin + Math.random() * (radiusMax - radiusMin);
            const angle = Math.random() * Math.PI * 2 + r * spin;
            const wob = (Math.random() - 0.5) * 0.6;

            positions[i3] = (Math.cos(angle) * r + wob * 0.4) * SCALE;
            positions[i3 + 1] = ((Math.random() - 0.5) * 0.35) * SCALE;
            positions[i3 + 2] = (Math.sin(angle) * r + wob * 0.4) * SCALE;

            const c = colorOuter.clone().lerp(colorMid, Math.random() * 0.5);
            colors[i3] = c.r;
            colors[i3 + 1] = c.g;
            colors[i3 + 2] = c.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const mat = new THREE.PointsMaterial({
            size: size * SCALE,
            map: glowTexture,
            vertexColors: true,
            transparent: true,
            opacity,
            alphaTest: 0.001,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
        });

        return new THREE.Points(geo, mat);
    }

    const ring1 = buildOuterRing({ count: 2500, radiusMin: 5.3, radiusMax: 6.6, spin: 2.0, size: 0.16, opacity: 0.55 });
    const ring2 = buildOuterRing({ count: 1800, radiusMin: 7.2, radiusMax: 8.6, spin: 1.6, size: 0.2, opacity: 0.35 });
    galaxyGroup.add(ring1, ring2);

    const coreGeo = new THREE.BufferGeometry();
    coreGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
    const coreMat = new THREE.PointsMaterial({
        size: 3.2 * SCALE,
        map: glowTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
    });
    const core = new THREE.Points(coreGeo, coreMat);
    galaxyGroup.add(core);

    function buildBackgroundStars(count) {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const r = 40 + Math.random() * 60;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            positions[i3] = r * Math.sin(phi) * Math.cos(theta) * SCALE;
            positions[i3 + 1] = r * Math.cos(phi) * SCALE;
            positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta) * SCALE;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            size: 0.06 * SCALE,
            map: glowTexture,
            color: 0xffffff,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
        });

        return new THREE.Points(geo, mat);
    }

    galaxyGroup.add(buildBackgroundStars(1500));

    const GALAXY_Z = -3000;
    galaxyGroup.position.set(0, 0, GALAXY_Z);
    galaxyGroup.rotation.x = Math.PI / 4;
    scene.add(galaxyGroup);

    const starCount = 9000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        starPositions[i3] = (Math.random() - 0.5) * 4400;
        starPositions[i3 + 1] = (Math.random() - 0.5) * 2600;
        starPositions[i3 + 2] = GALAXY_Z - 2200 + Math.random() * 3600;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
        size: 16,
        map: glowTexture,
        color: 0xd9ecff,
        transparent: true,
        opacity: 0.72,
        alphaTest: 0.001,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    starField.visible = false;
    scene.add(starField);

    const clock = new THREE.Clock();
    let cameraSpeed = 0;
    let redParticleSpeed = 500;
    let isWhiteout = false;
    let animationFrameId = null;
    let isDestroyed = false;

    function animate() {
        if (isDestroyed) return;
        animationFrameId = requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const elapsedTime = clock.elapsedTime;

        starField.visible = elapsedTime >= 10 && elapsedTime < 25;
        if (elapsedTime >= 10 && elapsedTime < 22) {
            starMaterial.opacity = THREE.MathUtils.lerp(starMaterial.opacity, 0.72, delta * 4);
        } else if (elapsedTime >= 22 && elapsedTime < 25) {
            const fadeProgress = (elapsedTime - 22) / 3;
            starMaterial.opacity = 0.72 * (1 - fadeProgress);
        } else {
            starMaterial.opacity = 0;
        }

        galaxyGroup.rotateY(delta * 0.22);
        ring1.rotation.y -= delta * 0.025;
        ring2.rotation.y -= delta * 0.015;
        core.material.opacity = 0.75 + Math.sin(elapsedTime * 1.5) * 0.12;

        if (elapsedTime < 5) {
            redParticleSystem.rotation.z += delta * 1.5;
            camera.position.x = (Math.random() - 0.5) * 0.6;
            camera.position.y = (Math.random() - 0.5) * 0.6;
        }

        if (elapsedTime >= 5 && elapsedTime < 10) {
            hud.innerText = 'VÓRTICE SUPERADO.\nGALAXIA DETECTADA.\nINICIANDO APROXIMACIÓN...';
            hud.style.color = '#aaffaa';

            redMaterial.opacity -= delta * 0.25;
            redParticleSpeed = THREE.MathUtils.lerp(redParticleSpeed, 20, delta * 0.5);
            scene.fog.color.lerp(new THREE.Color(0x000005), delta * 0.5);
            scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, 0.00015, delta * 0.8);

            camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, delta * 2);
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, delta * 2);
        }

        if (elapsedTime >= 10 && elapsedTime < 25) {
            hud.innerText = 'ATRACCIÓN GRAVITACIONAL DETECTADA.\nÓRBITA DE OBSERVACIÓN DESCENDENTE...';
            hud.style.color = '#ffcc55';

            cameraSpeed = THREE.MathUtils.lerp(cameraSpeed, 240, delta * 0.2);
            camera.position.z -= cameraSpeed * delta;
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, delta * 0.15);
            camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, 0, delta * 0.15);
            camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, 0.05, delta * 0.2);
        }

        if (elapsedTime >= 25 && elapsedTime < 32) {
            hud.innerText = 'GALAXIA ESTABILIZADA.\nOBSERVANDO ROTACIÓN...';
            hud.style.color = '#aaffff';

            cameraSpeed = 0;
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, delta * 0.15);
            camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, 0, delta * 0.15);
            camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, 0, delta * 0.2);
        }

        if (elapsedTime >= 32 && !isWhiteout) {
            hud.innerText = 'CAÍDA LIBRE AL NÚCLEO.\nPREPARESE PARA EL IMPACTO.';
            hud.style.color = '#ff4444';

            cameraSpeed = THREE.MathUtils.lerp(cameraSpeed, 2500, delta * 0.8);
            camera.position.z -= cameraSpeed * delta;
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, delta * 1.5);
            camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, 0, delta * 2);
            camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, 0, delta * 2);

            if (camera.fov < 150) {
                camera.fov += 25 * delta;
                camera.updateProjectionMatrix();
            }
        }

        if (camera.position.z <= GALAXY_Z - 220 && !isWhiteout) {
            isWhiteout = true;
            whiteout.style.opacity = 1;
            message.style.opacity = 1;
            hud.style.opacity = 0;
        }

        if (redMaterial.opacity > 0) {
            const positions = redGeometry.attributes.position.array;
            for (let i = 0; i < redParticlesCount; i++) {
                positions[i * 3 + 2] += redParticleSpeed * delta;
                if (positions[i * 3 + 2] > camera.position.z + 20) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 20 + Math.random() * 50;
                    positions[i * 3] = Math.cos(angle) * radius;
                    positions[i * 3 + 1] = Math.sin(angle) * radius;
                    positions[i * 3 + 2] = camera.position.z - 800 - Math.random() * 100;
                }
            }
            redGeometry.attributes.position.needsUpdate = true;
        }

        renderer.render(scene, camera);
    }

    const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', onResize);
    animate();

    return {
        scene,
        camera,
        renderer,
        destroy() {
            isDestroyed = true;
            if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
            mount.remove();
        },
    };
}
