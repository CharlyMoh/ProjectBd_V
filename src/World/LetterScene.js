import * as THREE from 'three';

export class LetterScene {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.particles = null; 
        this.universeParticles = null; 
        this.comets = []; // Arreglo para nuestras estrellas fugaces
        
        this.targetPositions = [];
        this.isFormingText = false;
        
        this.mouseX = 0;
        this.mouseY = 0;
        this.lerpFactor = 0;

        this.initUniverse(); 
        this.initComets(); // Iniciamos los cometas
        this.initParticles(); 
        this.initHTML();
        this.initMouseTracking();
    }

    initUniverse() {
        const bgCount = 15000; // ¡15,000 estrellas para una saturación hermosa!
        const bgGeometry = new THREE.BufferGeometry();
        const bgPositions = new Float32Array(bgCount * 3);
        const bgColors = new Float32Array(bgCount * 3);

        // Paleta de colores realista para estrellas (Blancas, azuladas y doradas)
        const colorPalette = [
            new THREE.Color('#ffffff'), // Blanco puro
            new THREE.Color('#d4eaff'), // Azul estelar
            new THREE.Color('#ffdfb0'), // Dorado cálido
            new THREE.Color('#f8f9fa')  // Blanco grisáceo
        ];

        for(let i = 0; i < bgCount; i++) {
            // Distribución en una gran esfera para envolver la cámara
            const r = 300 * Math.cbrt(Math.random()); 
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);

            bgPositions[i*3] = r * Math.sin(phi) * Math.cos(theta);
            bgPositions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            bgPositions[i*3+2] = r * Math.cos(phi) - 50; // Empujar un poco hacia el fondo

            // Asignar un color aleatorio de la paleta
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            bgColors[i*3] = color.r;
            bgColors[i*3+1] = color.g;
            bgColors[i*3+2] = color.b;
        }

        bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
        bgGeometry.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));

        const bgMaterial = new THREE.PointsMaterial({
            size: 0.4, 
            vertexColors: true, // Activamos colores individuales por partícula
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            blending: THREE.AdditiveBlending // Hace que brillen al encimarse
        });

        this.universeParticles = new THREE.Points(bgGeometry, bgMaterial);
        this.group.add(this.universeParticles);
    }

    // --- NUEVO: SISTEMA DE COMETAS / ESTRELLAS FUGACES ---
    initComets() {
        const cometMaterial = new THREE.MeshBasicMaterial({
            color: '#ffffff',
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        // Usamos una esfera pequeña que luego estiraremos para hacer la estela
        const cometGeo = new THREE.SphereGeometry(0.15, 4, 4);

        for (let i = 0; i < 6; i++) { // 6 cometas activos simultáneamente
            const comet = new THREE.Mesh(cometGeo, cometMaterial);
            this.resetComet(comet);
            this.group.add(comet);
            this.comets.push(comet);
        }
    }

    resetComet(comet) {
        // Aparecen en posiciones lejanas y altas
        comet.position.set(
            (Math.random() - 0.5) * 300,
            (Math.random() * 100) + 50, // Siempre aparecen arriba
            (Math.random() - 0.5) * 100 - 50
        );

        // Velocidad de caída diagonal
        comet.userData.velocity = new THREE.Vector3(
            (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1), // Izquierda o derecha
            -(Math.random() * 2 + 1.5), // Caída rápida
            0
        );

        // Estiramos la esfera geométricamente para que parezca un rayo de luz
        comet.scale.set(15, 0.4, 0.4); 
        
        // Alineamos la rotación del cometa con su dirección de viaje
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
        
        // ---> ¡CAMBIA ESTO POR EL NOMBRE DE LA FESTEJADA! <---
        ctx.fillText("NOMBRE", 512, 128); 

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        
        const initialPositions = [];
        this.targetPositions = [];

        for (let y = 0; y < canvas.height; y += 4) {
            for (let x = 0; x < canvas.width; x += 4) {
                const alpha = data[(x + y * canvas.width) * 4 + 3];
                if (alpha > 128) { 
                    const scale = 0.05;
                    const tx = (x - 512) * scale;
                    const ty = -(y - 128) * scale;
                    const tz = (Math.random() - 0.5) * 1.5; 
                    this.targetPositions.push(new THREE.Vector3(tx, ty, tz));

                    // Inician esparcidas por todo el nuevo universo inmenso
                    const ix = (Math.random() - 0.5) * 300;
                    const iy = (Math.random() - 0.5) * 300;
                    const iz = (Math.random() - 0.5) * 200;
                    initialPositions.push(ix, iy, iz);
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(initialPositions, 3));

        const material = new THREE.PointsMaterial({
            size: 0.5, 
            color: '#ff8aeb', // Tono rosa fuerte para resaltar entre las estrellas blancas
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
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
        this.startBtn.style.background = 'linear-gradient(90deg, #ff00cc, #6600ff)'; 
        this.startBtn.style.border = 'none';
        this.startBtn.style.borderRadius = '30px';
        this.startBtn.style.boxShadow = '0 0 15px rgba(255, 0, 204, 0.5)';
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
            <br><br><br>
            <p style="font-size: 16px; color: #aaaaaa;">(Desplázate hacia abajo para ver más estrellas...)</p>
            <br><br><br>
            <button id="btn-volver-lobby" style="
                padding: 12px 25px; 
                font-family: inherit; 
                cursor: pointer; 
                background: rgba(255,255,255,0.1); 
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
                    if(this.onReturnToLobby) this.onReturnToLobby();
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
        // Rotación general del grupo principal
        const targetRotX = this.mouseY * 0.15;
        const targetRotY = this.mouseX * 0.15;
        this.group.rotation.x += (targetRotX - this.group.rotation.x) * 0.05;
        this.group.rotation.y += (targetRotY - this.group.rotation.y) * 0.05;

        // Animar las estrellas del fondo
        if (this.universeParticles) {
            this.universeParticles.rotation.y = time * 0.015;
            this.universeParticles.rotation.x = time * 0.005;
        }

        // Animar los cometas (estrellas fugaces)
        this.comets.forEach(comet => {
            comet.position.add(comet.userData.velocity);
            
            // Si el cometa sale de la pantalla por abajo o por los lados, se reinicia
            if (comet.position.y < -150 || Math.abs(comet.position.x) > 200) {
                this.resetComet(comet);
            }
        });

        // Formar el texto
        if (this.isFormingText && this.particles) {
            this.lerpFactor += 0.005; 
            if (this.lerpFactor > 1) this.lerpFactor = 1;

            const positions = this.particles.geometry.attributes.position.array;
            
            for (let i = 0; i < this.targetPositions.length; i++) {
                const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
                positions[ix] += (this.targetPositions[i].x - positions[ix]) * 0.03;
                positions[iy] += (this.targetPositions[i].y - positions[iy]) * 0.03;
                positions[iz] += (this.targetPositions[i].z - positions[iz]) * 0.03;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        } else if (this.particles) {
            this.group.rotation.y += 0.001; 
        }
    }

    destroy() {
        this.scene.remove(this.group);
        if(this.uiContainer) this.uiContainer.remove();
    }
}