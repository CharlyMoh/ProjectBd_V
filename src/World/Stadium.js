import * as THREE from 'three';

export class Stadium {
    constructor(scene, videoTexture) {
        this.scene = scene;
        this.videoTexture = videoTexture; // Recibimos la textura del video desde main
        
        this.createCentralStage();
        this.create360Screens();
        this.createArmyBombOcean360();
    }

    createCentralStage() {
        // 1. Escenario circular principal en el puro centro del estadio
        const stageGeo = new THREE.CylinderGeometry(8, 8, 0.8, 48);
        const stageMat = new THREE.MeshStandardMaterial({ color: '#151515', roughness: 0.5 });
        const centralStage = new THREE.Mesh(stageGeo, stageMat);
        centralStage.position.set(0, 0.4, 0);
        this.scene.add(centralStage);

        // 2. Pasarelas en "X" (Rotadas 45 grados) para coincidir con el plano
        const runwayMat = new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.6 });
        const runwayGeo = new THREE.BoxGeometry(4, 0.7, 34); 
        
        // Pasarela Diagonal 1 (\)
        const runway1 = new THREE.Mesh(runwayGeo, runwayMat);
        runway1.position.set(0, 0.35, 0);
        runway1.rotation.y = Math.PI / 4;
        this.scene.add(runway1);

        // Pasarela Diagonal 2 (/)
        const runway2 = new THREE.Mesh(runwayGeo, runwayMat);
        runway2.position.set(0, 0.35, 0);
        runway2.rotation.y = -Math.PI / 4;
        this.scene.add(runway2);
    }

    create360Screens() {
        this.screensGroup = new THREE.Group();

        const screenMat = new THREE.MeshBasicMaterial({
            map: this.videoTexture,
            side: THREE.DoubleSide
        });

        // 1. DIMENSIONES EXACTAS BASADAS EN TU PLANO AÉREO
        const widthX = 12;      // Ancho de las pantallas frontales (Norte-Sur)
        const depthZ = 16;      // Largo de las pantallas laterales (Este-Oeste, es más largo)
        const height = 6.5;     // Altura compartida de todas las pantallas
        const elevation = 12;   // Altura sobre el escenario principal

        const wingLength = 12;  // Longitud de las pantallas diagonales rojas que dibujaste
        const wingHalf = wingLength / 2;

        // --- 2. EL NÚCLEO CENTRAL RECTANGULAR ---
        const geoNorteSur = new THREE.PlaneGeometry(widthX, height);
        const geoEsteOeste = new THREE.PlaneGeometry(depthZ, height);

        // Pantalla Norte
        const screenN = new THREE.Mesh(geoNorteSur, screenMat);
        screenN.position.set(0, elevation, -depthZ / 2);

        // Pantalla Sur
        const screenS = new THREE.Mesh(geoNorteSur, screenMat);
        screenS.position.set(0, elevation, depthZ / 2);
        screenS.rotation.y = Math.PI;

        // Pantalla Este
        const screenE = new THREE.Mesh(geoEsteOeste, screenMat);
        screenE.position.set(widthX / 2, elevation, 0);
        screenE.rotation.y = -Math.PI / 2;

        // Pantalla Oeste
        const screenW = new THREE.Mesh(geoEsteOeste, screenMat);
        screenW.position.set(-widthX / 2, elevation, 0);
        screenW.rotation.y = Math.PI / 2;

        this.screensGroup.add(screenN, screenS, screenE, screenW);

        // --- 3. LAS 4 EXTENSIONES DIAGONALES DESDE LAS ESQUINAS ("X") ---
        const wingGeo = new THREE.PlaneGeometry(wingLength, height);

        // Esquina Nor-Este (Arriba a la derecha)
        const wingNE = new THREE.Mesh(wingGeo, screenMat);
        wingNE.position.set(
            (widthX / 2) + wingHalf * Math.cos(-Math.PI / 4),
            elevation,
            (-depthZ / 2) + wingHalf * Math.sin(-Math.PI / 4)
        );
        wingNE.rotation.y = Math.PI / 4;

        // Esquina Nor-Oeste (Arriba a la izquierda)
        const wingNW = new THREE.Mesh(wingGeo, screenMat);
        wingNW.position.set(
            (-widthX / 2) + wingHalf * Math.cos(-3 * Math.PI / 4),
            elevation,
            (-depthZ / 2) + wingHalf * Math.sin(-3 * Math.PI / 4)
        );
        wingNW.rotation.y = -Math.PI / 4;

        // Esquina Sur-Este (Abajo a la derecha)
        const wingSE = new THREE.Mesh(wingGeo, screenMat);
        wingSE.position.set(
            (widthX / 2) + wingHalf * Math.cos(Math.PI / 4),
            elevation,
            (depthZ / 2) + wingHalf * Math.sin(Math.PI / 4)
        );
        wingSE.rotation.y = -Math.PI / 4;

        // Esquina Sur-Oeste (Abajo a la izquierda)
        const wingSW = new THREE.Mesh(wingGeo, screenMat);
        wingSW.position.set(
            (-widthX / 2) + wingHalf * Math.cos(3 * Math.PI / 4),
            elevation,
            (depthZ / 2) + wingHalf * Math.sin(3 * Math.PI / 4)
        );
        wingSW.rotation.y = Math.PI / 4;

        // Añadimos las alas y metemos todo al escenario
        this.screensGroup.add(wingNE, wingNW, wingSE, wingSW);
        this.scene.add(this.screensGroup);
    }

    createArmyBombOcean360() {
        const count = 12000; 
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const colorPurple = new THREE.Color('#7f00ff');

        let i = 0;
        
        // Bucle que filtra y acomoda las luces según el plano del tour
        while (i < count) {
            const x = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 110;
            const distCenter = Math.sqrt(x*x + z*z);
            let y = 0;
            let valid = false;

            // --- ZONA 1: EXCLUSIÓN (Escenario en X vacío) ---
            if (distCenter < 12) continue; 
            if (Math.abs(x - z) < 6 && distCenter < 22) continue; // Diagonal \
            if (Math.abs(x + z) < 6 && distCenter < 22) continue; // Diagonal /

            // --- ZONA 2: PLATINO (Cancha nivelada) ---
            if (Math.abs(x) < 23 && Math.abs(z) < 28) {
                y = 0.2 + Math.random() * 0.5;
                valid = true;
            }
            // --- ZONA 3: PASILLO DE SEPARACIÓN ---
            else if (Math.abs(x) < 26 && Math.abs(z) < 32) {
                continue; 
            }
            // --- ZONA 4: GRADAS POLIGONALES (Elevación) ---
            else {
                // Corte de las esquinas extremas para dar forma hexagonal
                if (Math.abs(x) + Math.abs(z) > 80) continue; 

                const distX = Math.max(Math.abs(x) - 26, 0);
                const distZ = Math.max(Math.abs(z) - 32, 0);
                const distEdge = Math.sqrt(distX*distX + distZ*distZ);
                
                y = 2 + (distEdge * 0.7) + (Math.random() * 1.5);
                valid = true;
            }

            if (valid) {
                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = z;

                colors[i * 3] = colorPurple.r;
                colors[i * 3 + 1] = colorPurple.g;
                colors[i * 3 + 2] = colorPurple.b;
                i++;
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        this.pointsMaterial = new THREE.PointsMaterial({
            size: 0.35,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending 
        });

        this.lightOcean = new THREE.Points(geometry, this.pointsMaterial);
        this.scene.add(this.lightOcean);
    }

    // Efecto de cambios de color sincrónicos globales (Rojo, Cian, Blanco, Morado)
    update(time) {
        const colorsAttribute = this.lightOcean.geometry.attributes.color;
        
        // Simular los cambios drásticos de color de las fotos (Toma 2: Rojo, Toma 4: Verde/Cian)
        const cycle = Math.floor(time / 6) % 4; // Cambia de patrón cada 6 segundos
        
        for (let i = 0; i < colorsAttribute.count; i++) {
            const wave = Math.sin(time * 3 + i * 0.02);

            if (cycle === 0) {
                // FOTO 2: Todo el estadio en un océano Rojo ardiente
                if (wave > 0.6) colorsAttribute.setXYZ(i, 1.0, 1.0, 1.0); // Destellos blancos
                else colorsAttribute.setXYZ(i, 0.9, 0.0, 0.0);
            } else if (cycle === 1) {
                // FOTO 4: Océano Cian / Verde Esmeralda místico
                if (wave > 0.6) colorsAttribute.setXYZ(i, 1.0, 1.0, 1.0);
                else colorsAttribute.setXYZ(i, 0.0, 0.8, 0.5);
            } else if (cycle === 2) {
                // FOTO 3: Océano Plateado / Blanco destellante masivo
                if (wave > 0.2) colorsAttribute.setXYZ(i, 0.9, 0.9, 1.0);
                else colorsAttribute.setXYZ(i, 0.2, 0.2, 0.4);
            } else {
                // Color Clásico: El representativo Morado Borahae
                if (wave > 0.6) colorsAttribute.setXYZ(i, 1.0, 0.5, 1.0);
                else colorsAttribute.setXYZ(i, 0.4, 0.0, 0.8);
            }
        }
        colorsAttribute.needsUpdate = true;
    }
}