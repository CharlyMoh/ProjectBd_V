import * as THREE from 'three';

export class LetterScene {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.particles = null; // Estas serán las estrellas que formarán el texto
        this.universeParticles = null; // El resto de la galaxia de fondo
        this.ambientStars = null;
        this.comets = [];

        this.targetPositions = [];
        this.isFormingText = false;

        this.mouseX = 0;
        this.mouseY = 0;
        this.lerpFactor = 0;

        this.initUniverse();
        this.initComets();
        this.initParticles(); // 
        this.initHTML();
        this.initMouseTracking();
    }

    initUniverse() {

        this.spiralData = [];

        const particleCount = 25000;
        const maxRadius = 90;

        const geometry = new THREE.BufferGeometry();

        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const colorCenter = new THREE.Color("#ffffff");
        const colorBlue1 = new THREE.Color("#7dd3fc");
        const colorBlue2 = new THREE.Color("#38bdf8");
        const colorBlue3 = new THREE.Color("#2563eb");

        for (let i = 0; i < particleCount; i++) {

            const i3 = i * 3;

            const radius =
                Math.pow(Math.random(), 1.8) * maxRadius;

            const angle =
                Math.random() * Math.PI * 2;

            const speed =
                (0.0003 + Math.random() * 0.0012) *
                (1.5 - radius / maxRadius);

            this.spiralData.push({
                radius,
                angle,
                speed
            });

            const spiralStrength = 0.28;

            const wave =
                Math.sin(angle * 5 + radius * 0.08) * 2;

            positions[i3] =
                Math.cos(angle + radius * spiralStrength) *
                radius +
                wave;

            positions[i3 + 1] =
                Math.sin(angle * 2) *
                radius *
                0.03 +
                (Math.random() - 0.5) * 3;

            positions[i3 + 2] =
                Math.sin(angle + radius * spiralStrength) *
                radius +
                wave;

            const mix = radius / maxRadius;

            const c = new THREE.Color();

            if (mix < 0.3) {

                c.copy(colorCenter)
                    .lerp(colorBlue1, mix / 0.3);

            } else if (mix < 0.7) {

                c.copy(colorBlue1)
                    .lerp(colorBlue2, (mix - 0.3) / 0.4);

            } else {

                c.copy(colorBlue2)
                    .lerp(colorBlue3, (mix - 0.7) / 0.3);
            }

            if (Math.random() > 0.985) {

                c.set("#ffffff");
            }

            colors[i3] = c.r;
            colors[i3 + 1] = c.g;
            colors[i3 + 2] = c.b;
        }

        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
        );

        geometry.setAttribute(
            "color",
            new THREE.BufferAttribute(colors, 3)
        );

        const material = new THREE.PointsMaterial({

            size: 0.7,

            vertexColors: true,

            transparent: true,

            opacity: 1,

            depthWrite: false,

            blending: THREE.AdditiveBlending
        });

        this.universeParticles =
            new THREE.Points(
                geometry,
                material
            );

        this.universeParticles.position.set(
            0,
            0,
            -60
        );

        this.universeParticles.rotation.x = -0.8;
this.universeParticles.rotation.z = -0.25;

        this.group.add(
            this.universeParticles
        );

        // -------- CORE --------

        const coreGeo =
            new THREE.BufferGeometry();

        const coreCount = 5000;

        const corePos =
            new Float32Array(coreCount * 3);

        this.coreData = [];

        for (let i = 0; i < coreCount; i++) {

            const i3 = i * 3;

            const radius =
                Math.random() * 12;

            const angle =
                Math.random() * Math.PI * 2;

            this.coreData.push({
                radius,
                angle,
                speed:
                    0.002 +
                    Math.random() * 0.003
            });

            corePos[i3] =
                Math.cos(angle) * radius;

            corePos[i3 + 1] =
                (Math.random() - 0.5) * 2;

            corePos[i3 + 2] =
                Math.sin(angle) * radius;
        }

        coreGeo.setAttribute(
            "position",
            new THREE.BufferAttribute(corePos, 3)
        );

        this.coreParticles =
            new THREE.Points(
                coreGeo,
                new THREE.PointsMaterial({

                    color: "#ffffff",

                    size: 1.4,

                    transparent: true,

                    opacity: 1,

                    blending:
                        THREE.AdditiveBlending,

                    depthWrite: false
                })
            );

        this.coreParticles.position.z = -60;

        this.coreParticles.rotation.x = -0.8;
this.coreParticles.rotation.z = -0.25;

        this.group.add(
            this.coreParticles
        );

        // -------- STAR FIELD --------

        const ambientCount = 7000;

        const ambientGeo =
            new THREE.BufferGeometry();

        const ambientPos =
            new Float32Array(
                ambientCount * 3
            );

        for (let i = 0; i < ambientCount; i++) {

            const i3 = i * 3;

            ambientPos[i3] =
                (Math.random() - 0.5) * 500;

            ambientPos[i3 + 1] =
                (Math.random() - 0.5) * 300;

            ambientPos[i3 + 2] =
                (Math.random() - 0.5) * 300;
        }

        ambientGeo.setAttribute(
            "position",
            new THREE.BufferAttribute(
                ambientPos,
                3
            )
        );

        this.ambientStars =
            new THREE.Points(
                ambientGeo,
                new THREE.PointsMaterial({

                    color: "#ffffff",

                    size: 0.35,

                    transparent: true,

                    opacity: 0.3,

                    blending:
                        THREE.AdditiveBlending,

                    depthWrite: false
                })
            );

        this.group.add(
            this.ambientStars
        );
    }

    initComets() {
        const cometMaterial = new THREE.MeshBasicMaterial({
            color: '#ffffff',
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const cometGeo = new THREE.SphereGeometry(0.15, 4, 4);

        for (let i = 0; i < 5; i++) {
            const comet = new THREE.Mesh(cometGeo, cometMaterial);
            this.resetComet(comet);
            this.group.add(comet);
            this.comets.push(comet);
        }
    }

    resetComet(comet) {
        comet.position.set(
            (Math.random() - 0.5) * 200,
            (Math.random() * 100) + 50,
            (Math.random() - 0.5) * 80 - 40
        );

        comet.userData.velocity = new THREE.Vector3(
            (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1),
            -(Math.random() * 2 + 1.5),
            0
        );

        comet.scale.set(15, 0.4, 0.4);
        const direction = comet.userData.velocity.clone().normalize();
        comet.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction);
    }

    initParticles() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 100px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // ---> ¡PON AQUÍ EL NOMBRE DE LA FESTEJADA! <---
        ctx.fillText("NOMBRE", 512, 128);

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        const initialPositions = [];
        this.targetPositions = [];

        for (let y = 0; y < canvas.height; y += 4) {
            for (let x = 0; x < canvas.width; x += 4) {
                const alpha = data[(x + y * canvas.width) * 4 + 3];
                if (alpha > 128) {
                    // 1. POSICIONES FINALES (El texto plano frente a la cámara)
                    const scale = 0.05;
                    const tx = (x - 512) * scale;
                    const ty = -(y - 128) * scale;
                    const tz = (Math.random() - 0.5) * 1.5;
                    this.targetPositions.push(new THREE.Vector3(tx, ty, tz));

                    // 2. POSICIONES INICIALES (¡Nacen de la misma Galaxia Espiral!)
                    const maxRadius = 90;
                    const radius = Math.pow(Math.random(), 1.5) * maxRadius;
                    const spinAngle = radius * 0.035;
                    const branchAngle = ((Math.floor(Math.random() * 3)) / 3) * Math.PI * 2;
                    const scatter = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1);
                    const scatterX = scatter * (radius * 0.25 + 2);
                    const scatterZ = scatter * (radius * 0.25 + 2);
                    const scatterY = (Math.random() - 0.5) * (40 * Math.exp(-radius / 30) + 1.5);

                    initialPositions.push(
                        Math.cos(branchAngle + spinAngle) * radius + scatterX,
                        scatterY,
                        Math.sin(branchAngle + spinAngle) * radius + scatterZ
                    );
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(initialPositions, 3));

        const material = new THREE.PointsMaterial({
            size: 0.6,
            color: '#ab0f0f', // Color del texto (Nombre)
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);

        // Colocamos estas partículas exactamente en la misma rotación y posición que la galaxia base
        this.particles.position.set(0, 5, -60);
        this.particles.rotation.x = Math.PI * 0.35;

        this.group.add(this.particles);
    }

    initHTML() {
        this.uiContainer = document.createElement('div');
        this.uiContainer.style.position = 'absolute';
        this.uiContainer.style.top = '0';
        this.uiContainer.style.left = '0';
        this.uiContainer.style.width = '100%';
        this.uiContainer.style.height = '100%';
        this.uiContainer.style.zIndex = '9999';
        this.uiContainer.style.pointerEvents = 'none';
        this.uiContainer.style.display = 'flex';
        this.uiContainer.style.justifyContent = 'center';
        this.uiContainer.style.alignItems = 'center';
        document.body.appendChild(this.uiContainer);

        this.startBtn = document.createElement('button');
        this.startBtn.innerText = "ABRIR CARTA";
        this.startBtn.style.padding = '15px 40px';
        this.startBtn.style.fontSize = '18px';
        this.startBtn.style.fontFamily = '"Courier New", Courier, monospace';
        this.startBtn.style.fontWeight = 'bold';
        this.startBtn.style.color = '#ffffff';
        this.startBtn.style.background = 'linear-gradient(90deg, #ff1493, #ffaa00)';
        this.startBtn.style.border = 'none';
        this.startBtn.style.borderRadius = '30px';
        this.startBtn.style.boxShadow = '0 0 20px rgba(255, 20, 147, 0.6)';
        this.startBtn.style.cursor = 'pointer';
        this.startBtn.style.pointerEvents = 'auto';
        this.startBtn.style.transition = 'transform 0.2s';

        this.startBtn.onmouseover = () => { this.startBtn.style.transform = 'scale(1.05)'; };
        this.startBtn.onmouseout = () => { this.startBtn.style.transform = 'scale(1)'; };

        this.uiContainer.appendChild(this.startBtn);

        this.letterScrollContainer = document.createElement('div');
        this.letterScrollContainer.style.position = 'absolute';
        this.letterScrollContainer.style.top = '0';
        this.letterScrollContainer.style.left = '0';
        this.letterScrollContainer.style.width = '100%';
        this.letterScrollContainer.style.height = '100%';
        this.letterScrollContainer.style.overflowY = 'auto';
        this.letterScrollContainer.style.display = 'none';
        this.letterScrollContainer.style.pointerEvents = 'auto';

        this.letterContent = document.createElement('div');
        this.letterContent.style.marginTop = '70vh';
        this.letterContent.style.padding = '0 15% 150px 15%';
        this.letterContent.style.color = '#ffffff';
        this.letterContent.style.fontFamily = '"Courier New", Courier, monospace';
        this.letterContent.style.fontSize = '22px';
        this.letterContent.style.lineHeight = '2.0';
        this.letterContent.style.textAlign = 'center';
        this.letterContent.style.textShadow = '0px 4px 15px rgba(0,0,0,0.8)';

        this.letterContent.innerHTML = `
            <p>Hola,</p>
            <p>Quería hacer algo único y diferente para ti en este día tan especial.</p>
            <p>Gracias por ser mi inspiración, mi apoyo y la persona con la que quiero compartir cada momento.</p>
            <p>Espero que disfrutes de cada detalle de esta pequeña sorpresa, porque la hice pensando exclusivamente en ti.</p>
            <br><br><br>
            <p style="font-size: 16px; color: #aaaaaa;">(Desplázate hacia abajo para ver la galaxia...)</p>
            <br><br><br>
            <button id="btn-volver-lobby" style="
                padding: 12px 25px; 
                font-family: inherit; 
                cursor: pointer; 
                background: rgba(5,8,20,.55); 
                color: white; 
                border: 2px solid white; 
                border-radius: 20px;
                font-weight:bold;
                transition: all 0.3s;
            ">VOLVER AL PASILLO</button>
        `;

        this.letterScrollContainer.appendChild(this.letterContent);
        this.uiContainer.appendChild(this.letterScrollContainer);

        this.startBtn.addEventListener('click', () => {
            this.startBtn.style.display = 'none';
            this.isFormingText = true;

            setTimeout(() => {
                this.letterScrollContainer.style.display = 'block';
                const btnVolver = document.getElementById('btn-volver-lobby');
                btnVolver.onmouseover = () => { btnVolver.style.background = 'white'; btnVolver.style.color = 'black'; };
                btnVolver.onmouseout = () => { btnVolver.style.background = 'rgba(255,255,255,0.1)'; btnVolver.style.color = 'white'; };

                btnVolver.addEventListener('click', () => {
                    if (this.onReturnToLobby) this.onReturnToLobby();
                });
            }, 2500);
        });
    }

    initMouseTracking() {
        window.addEventListener('mousemove', (e) => {
            this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        });
    }

    update(time) {
        // La galaxia de fondo gira incesantemente
        if (this.universeParticles) {

            const positions =
                this.universeParticles.geometry
                    .attributes.position.array;

            for (let i = 0; i < this.spiralData.length; i++) {

                const p =
                    this.spiralData[i];

                p.angle += p.speed;

                const spiralStrength = 0.28;

                const wave =
                    Math.sin(
                        p.angle * 5 +
                        p.radius * 0.08
                    ) * 2;

                const i3 = i * 3;

                positions[i3] =
                    Math.cos(
                        p.angle +
                        p.radius * spiralStrength
                    ) *
                    p.radius +
                    wave;

                positions[i3 + 1] =
                    Math.sin(
                        p.angle * 2
                    ) *
                    p.radius *
                    0.03;

                positions[i3 + 2] =
                    Math.sin(
                        p.angle +
                        p.radius * spiralStrength
                    ) *
                    p.radius +
                    wave;
            }

            this.universeParticles
                .geometry
                .attributes
                .position
                .needsUpdate = true;
        }

        if (this.coreParticles) {

            const positions =
                this.coreParticles
                    .geometry
                    .attributes
                    .position.array;

            for (let i = 0; i < this.coreData.length; i++) {

                const p =
                    this.coreData[i];

                p.angle += p.speed;

                const i3 = i * 3;

                positions[i3] =
                    Math.cos(p.angle) *
                    p.radius;

                positions[i3 + 2] =
                    Math.sin(p.angle) *
                    p.radius;
            }

            this.coreParticles
                .geometry
                .attributes
                .position
                .needsUpdate = true;
        }
        if (this.ambientStars) {
            this.ambientStars.rotation.y = time * 0.002;
        }

        // Parallax con el ratón
        const targetRotX = this.mouseY * 0.15;
        const targetRotY = this.mouseX * 0.15;
        this.group.rotation.x += (targetRotX - this.group.rotation.x) * 0.05;
        this.group.rotation.y += (targetRotY - this.group.rotation.y) * 0.05;

        // Cometas
        this.comets.forEach(comet => {
            comet.position.add(comet.userData.velocity);
            if (comet.position.y < -150 || Math.abs(comet.position.x) > 200) {
                this.resetComet(comet);
            }
        });

        if (this.isFormingText && this.particles) {
            // 1. Interpolamos la posición y rotación del contenedor a 0 (frente a la cámara)
            this.particles.rotation.x += (0 - this.particles.rotation.x) * 0.02;
            this.particles.rotation.z += (0 - this.particles.rotation.z) * 0.02;
            this.particles.position.x += (0 - this.particles.position.x) * 0.02;
            this.particles.position.y += (0 - this.particles.position.y) * 0.02;
            this.particles.position.z += (0 - this.particles.position.z) * 0.02;

            // 2. Interpolamos las posiciones individuales de las partículas para formar las letras
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < this.targetPositions.length; i++) {
                const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
                positions[ix] += (this.targetPositions[i].x - positions[ix]) * 0.03;
                positions[iy] += (this.targetPositions[i].y - positions[iy]) * 0.03;
                positions[iz] += (this.targetPositions[i].z - positions[iz]) * 0.03;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        } else if (this.particles) {
            // Antes de hacer clic, las estrellas del texto giran sincronizadas con el resto de la galaxia
            this.particles.rotation.z -= 0.0015;
        }
    }

    destroy() {
        this.scene.remove(this.group);
        if (this.uiContainer) this.uiContainer.remove();
    }
}