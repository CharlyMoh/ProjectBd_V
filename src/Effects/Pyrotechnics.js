import * as THREE from 'three';

export class Pyrotechnics {
    constructor(parentGroup) {
        this.group = parentGroup;
        this.activeFireworks = [];
        this.activeRockets = [];
        this.showTimeouts = []; // Para cancelar o reiniciar timeouts del show
    }

    // --- SHOW COREOGRAFIADO COMPLETO (15 SEG) ---
    startGrandShow() {
        this.clearPendingShow(); // Limpiar por si se presiona varias veces

        // FASE 1: Apertura con Fuentes y Ráfaga Baja (0s - 3s)
        this.triggerStageSparks();
        for (let i = 0; i < 4; i++) {
            this.scheduleTimeout(() => {
                this.launchRandomRocket('peony');
            }, i * 400);
        }

        // FASE 2: Anillos Neón y Lluvia de Sauce Dorada (3s - 8s)
        this.scheduleTimeout(() => {
            const ringColors = ['#00e5ff', '#ff007f', '#a855f7'];
            for (let i = 0; i < 6; i++) {
                this.scheduleTimeout(() => {
                    this.launchRandomRocket(i % 2 === 0 ? 'ring' : 'willow', ringColors[i % ringColors.length]);
                }, i * 700);
            }
        }, 3000);

        // FASE 3: Disparo Secuencial en Abanico (8s - 12s)
        this.scheduleTimeout(() => {
            this.triggerStageSparks();
            const colors = ['#ffbe00', '#ffffff', '#ff007f', '#00e5ff'];
            for (let i = 0; i < 10; i++) {
                this.scheduleTimeout(() => {
                    this.launchRandomRocket('peony', colors[i % colors.length]);
                }, i * 350);
            }
        }, 8000);

        // FASE 4: GRAND FINALE MASIVO (12s - 16s)
        this.scheduleTimeout(() => {
            // Fuentes encendidas al máximo
            this.triggerStageSparks();

            // Explosión masiva simultánea
            for (let i = 0; i < 12; i++) {
                this.scheduleTimeout(() => {
                    const origin = new THREE.Vector3(
                        (Math.random() - 0.5) * 35,
                        16 + Math.random() * 10,
                        (Math.random() - 0.5) * 35
                    );
                    const isFinaleGold = Math.random() > 0.4;
                    if (isFinaleGold) {
                        this.createWillowExplosion(origin, '#ffbe00');
                    } else {
                        this.createSkyExplosion(origin, '#ffffff');
                    }
                }, i * 150);
            }
        }, 12000);
    }

    scheduleTimeout(fn, delay) {
        const id = setTimeout(fn, delay);
        this.showTimeouts.push(id);
    }

    clearPendingShow() {
        this.showTimeouts.forEach(id => clearTimeout(id));
        this.showTimeouts = [];
    }

    triggerStageSparks() {
        const distFromCenter = 16.5;
        const angles = [
            Math.PI / 4,
            (3 * Math.PI) / 4,
            (-Math.PI) / 4,
            (-3 * Math.PI) / 4
        ];

        angles.forEach(angle => {
            const x = Math.cos(angle) * distFromCenter;
            const z = Math.sin(angle) * distFromCenter;
            this.createStageSparkFountain(new THREE.Vector3(x, 0.7, z));
        });
        this.createStageSparkFountain(new THREE.Vector3(0, 0.8, 0));
    }

    launchRandomRocket(type = 'peony', overrideColor = null) {
        const fireworkColors = ['#ff007f', '#00e5ff', '#a855f7', '#ffbe00', '#ffffff'];
        const launchAngle = Math.random() * Math.PI * 2;
        const launchRadius = 45 + Math.random() * 15;

        const startPos = new THREE.Vector3(
            Math.cos(launchAngle) * launchRadius,
            0,
            Math.sin(launchAngle) * launchRadius
        );

        const targetPos = new THREE.Vector3(
            (Math.random() - 0.5) * 30,
            18 + Math.random() * 7,
            (Math.random() - 0.5) * 30
        );

        const color = overrideColor || fireworkColors[Math.floor(Math.random() * fireworkColors.length)];

        this.launchRocket(startPos, targetPos, color, type);
    }

    launchRocket(startPos, targetPos, hexColor, type) {
        const count = 25;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const trailColor = new THREE.Color('#ffaa33');

        for (let i = 0; i < count; i++) {
            positions[i * 3] = startPos.x;
            positions[i * 3 + 1] = startPos.y;
            positions[i * 3 + 2] = startPos.z;

            colors[i * 3] = trailColor.r;
            colors[i * 3 + 1] = trailColor.g;
            colors[i * 3 + 2] = trailColor.b;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.55,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const rocketMesh = new THREE.Points(geometry, material);
        this.group.add(rocketMesh);

        this.activeRockets.push({
            mesh: rocketMesh,
            currentPos: startPos.clone(),
            targetPos: targetPos,
            color: hexColor,
            type: type,
            speed: 48 + Math.random() * 12,
            history: []
        });
    }

    // --- TIPOS DE EXPLOSIONES ---

    // 1. Peony (Esférica Estándar)
    createSkyExplosion(origin, hexColor) {
        const count = 300;
        const positions = new Float32Array(count * 3);
        const velocities = [];
        const colors = new Float32Array(count * 3);
        const baseColor = new THREE.Color(hexColor);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = origin.x;
            positions[i * 3 + 1] = origin.y;
            positions[i * 3 + 2] = origin.z;

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const speed = 9 + Math.random() * 10;

            velocities.push(new THREE.Vector3(
                speed * Math.sin(phi) * Math.cos(theta),
                speed * Math.sin(phi) * Math.sin(theta),
                speed * Math.cos(phi)
            ));

            colors[i * 3] = baseColor.r;
            colors[i * 3 + 1] = baseColor.g;
            colors[i * 3 + 2] = baseColor.b;
        }

        this.buildParticleMesh(positions, velocities, colors, 0.5, 0.016, -0.10);
    }

    // 2. Ring (Anillo Geométrico)
    createRingExplosion(origin, hexColor) {
        const count = 250;
        const positions = new Float32Array(count * 3);
        const velocities = [];
        const colors = new Float32Array(count * 3);
        const baseColor = new THREE.Color(hexColor);

        // Inclinación aleatoria del plano del anillo
        const tiltX = (Math.random() - 0.5) * 0.8;
        const tiltZ = (Math.random() - 0.5) * 0.8;

        for (let i = 0; i < count; i++) {
            positions[i * 3] = origin.x;
            positions[i * 3 + 1] = origin.y;
            positions[i * 3 + 2] = origin.z;

            const angle = (i / count) * Math.PI * 2;
            const speed = 12 + Math.random() * 2;

            const vx = Math.cos(angle) * speed;
            const vz = Math.sin(angle) * speed;
            const vy = (vx * tiltX) + (vz * tiltZ);

            velocities.push(new THREE.Vector3(vx, vy, vz));

            colors[i * 3] = baseColor.r;
            colors[i * 3 + 1] = baseColor.g;
            colors[i * 3 + 2] = baseColor.b;
        }

        this.buildParticleMesh(positions, velocities, colors, 0.6, 0.018, -0.06);
    }

    // 3. Willow / Sauce (Lluvia de oro persistente que cae lentamente)
    createWillowExplosion(origin, hexColor = '#ffbe00') {
        const count = 400;
        const positions = new Float32Array(count * 3);
        const velocities = [];
        const colors = new Float32Array(count * 3);
        const baseColor = new THREE.Color(hexColor);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = origin.x;
            positions[i * 3 + 1] = origin.y;
            positions[i * 3 + 2] = origin.z;

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const speed = 5 + Math.random() * 12;

            velocities.push(new THREE.Vector3(
                speed * Math.sin(phi) * Math.cos(theta),
                speed * Math.sin(phi) * Math.sin(theta) + 2, // Leve empuje inicial hacia arriba
                speed * Math.cos(phi)
            ));

            colors[i * 3] = baseColor.r;
            colors[i * 3 + 1] = baseColor.g;
            colors[i * 3 + 2] = baseColor.b;
        }

        // Decay muy bajo (0.008) y menor gravedad para que floten mucho tiempo
        this.buildParticleMesh(positions, velocities, colors, 0.45, 0.008, -0.04);
    }

    createStageSparkFountain(position) {
        const count = 180;
        const positions = new Float32Array(count * 3);
        const velocities = [];
        const colors = new Float32Array(count * 3);
        const goldColor = new THREE.Color('#ffaa00');

        for (let i = 0; i < count; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;

            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 2.2,
                8 + Math.random() * 6,
                (Math.random() - 0.5) * 2.2
            ));

            colors[i * 3] = goldColor.r;
            colors[i * 3 + 1] = goldColor.g;
            colors[i * 3 + 2] = goldColor.b;
        }

        this.buildParticleMesh(positions, velocities, colors, 0.4, 0.025, -0.22);
    }

    buildParticleMesh(positions, velocities, colors, size, decay, gravity) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: size,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const points = new THREE.Points(geometry, material);
        this.group.add(points);

        this.activeFireworks.push({
            mesh: points,
            velocities: velocities,
            life: 1.0,
            decay: decay,
            gravity: gravity
        });
    }

    update(delta) {
        // Update Cohetes
        for (let i = this.activeRockets.length - 1; i >= 0; i--) {
            const rocket = this.activeRockets[i];
            const dir = new THREE.Vector3().subVectors(rocket.targetPos, rocket.currentPos);
            const dist = dir.length();

            if (dist < 2.0 || rocket.currentPos.y >= rocket.targetPos.y) {
                // Detonar según el tipo elegido en la receta
                if (rocket.type === 'ring') {
                    this.createRingExplosion(rocket.currentPos, rocket.color);
                } else if (rocket.type === 'willow') {
                    this.createWillowExplosion(rocket.currentPos, rocket.color);
                } else {
                    this.createSkyExplosion(rocket.currentPos, rocket.color);
                }

                this.group.remove(rocket.mesh);
                rocket.mesh.geometry.dispose();
                rocket.mesh.material.dispose();
                this.activeRockets.splice(i, 1);
                continue;
            }

            dir.normalize();
            rocket.currentPos.addScaledVector(dir, rocket.speed * delta);

            rocket.history.unshift(rocket.currentPos.clone());
            if (rocket.history.length > 20) rocket.history.pop();

            const posAttr = rocket.mesh.geometry.attributes.position;
            const posArray = posAttr.array;

            for (let j = 0; j < posAttr.count; j++) {
                const p = rocket.history[j] || rocket.currentPos;
                posArray[j * 3] = p.x + (Math.random() - 0.5) * 0.3;
                posArray[j * 3 + 1] = p.y + (Math.random() - 0.5) * 0.3;
                posArray[j * 3 + 2] = p.z + (Math.random() - 0.5) * 0.3;
            }
            posAttr.needsUpdate = true;
        }

        // Update Partículas
        for (let i = this.activeFireworks.length - 1; i >= 0; i--) {
            const fw = this.activeFireworks[i];
            fw.life -= fw.decay;

            if (fw.life <= 0) {
                this.group.remove(fw.mesh);
                fw.mesh.geometry.dispose();
                fw.mesh.material.dispose();
                this.activeFireworks.splice(i, 1);
                continue;
            }

            fw.mesh.material.opacity = fw.life;
            const posAttr = fw.mesh.geometry.attributes.position;
            const posArray = posAttr.array;

            for (let j = 0; j < fw.velocities.length; j++) {
                const vel = fw.velocities[j];
                vel.y += fw.gravity;

                posArray[j * 3] += vel.x * delta;
                posArray[j * 3 + 1] += vel.y * delta;
                posArray[j * 3 + 2] += vel.z * delta;
            }

            posAttr.needsUpdate = true;
        }
    }

    destroy() {
        this.clearPendingShow();
        for (let rocket of this.activeRockets) {
            this.group.remove(rocket.mesh);
            rocket.mesh.geometry.dispose();
            rocket.mesh.material.dispose();
        }
        this.activeRockets = [];

        for (let fw of this.activeFireworks) {
            this.group.remove(fw.mesh);
            fw.mesh.geometry.dispose();
            fw.mesh.material.dispose();
        }
        this.activeFireworks = [];
    }
}