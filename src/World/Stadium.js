import * as THREE from 'three';
import { Pyrotechnics } from '../Effects/Pyrotechnics.js';

export class Stadium {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        this.stadiumGroup = new THREE.Group();
        this.scene.add(this.stadiumGroup);

        this.onReturnToLobby = null;

        // --- CÁMARAS Y NAVEGACIÓN ---
        this.currentCameraMode = 'dron'; 
        this.targetCamPos = new THREE.Vector3();
        this.targetLookAt = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3(0, 4, 0);
        this.cameraTransition = 0;
        this.grandShowStarted = false;
        this.finaleCameraStarted = false;
        this.showEnded = false;

        // --- SISTEMA DE PIROTECNIA Y AUDIO ---
        this.pyrotechnics = new Pyrotechnics(this.stadiumGroup);
        
        this.audioCtx = null;
        this.analyser = null;
        this.dataArray = null;
        this.isAudioActive = false;

        this.videoTexture = this.createVideoTexture();
        
        this.createCentralStage();
        this.create360Screens();
        this.createArmyBombOcean360();
        this.initHTML();
    }

    createVideoTexture() {
        this.video = document.createElement('video');
        this.video.src = '/assets/bts-concert.mp4'; 
        this.video.load();
        this.video.loop = false;
        this.video.muted = true; // Empieza en silenciador por políticas del navegador
        this.video.playsInline = true;
        this.video.setAttribute('playsinline', '');
        this.video.addEventListener('ended', () => this.handleShowEnd());

        this.video.play().catch(error => {
            console.log("Esperando interacción para reproducir video:", error);
        });

        const texture = new THREE.VideoTexture(this.video);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        return texture;
    }

    // --- CONEXIÓN DE AUDIO REACTIVO ---
    initAudioAnalyser() {
        if (this.audioCtx) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64; // Bins reducidos para respuesta ultrarrápida (32 frecuencias)

        // Conectar el video al analizador y a las bocinas
        this.audioSource = this.audioCtx.createMediaElementSource(this.video);
        this.audioSource.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);

        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }

    createCentralStage() {
        const stageGeo = new THREE.CylinderGeometry(8, 8, 0.8, 48);
        const stageMat = new THREE.MeshStandardMaterial({ color: '#151515', roughness: 0.5 });
        const centralStage = new THREE.Mesh(stageGeo, stageMat);
        centralStage.position.set(0, 0.4, 0);
        this.stadiumGroup.add(centralStage);

        const runwayMat = new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.6 });
        const runwayGeo = new THREE.BoxGeometry(4, 0.7, 34); 
        
        const runway1 = new THREE.Mesh(runwayGeo, runwayMat);
        runway1.position.set(0, 0.35, 0);
        runway1.rotation.y = Math.PI / 4;
        this.stadiumGroup.add(runway1);

        const runway2 = new THREE.Mesh(runwayGeo, runwayMat);
        runway2.position.set(0, 0.35, 0);
        runway2.rotation.y = -Math.PI / 4;
        this.stadiumGroup.add(runway2);
    }

    create360Screens() {
        this.screensGroup = new THREE.Group();

        const screenMat = new THREE.MeshBasicMaterial({
            map: this.videoTexture,
            side: THREE.DoubleSide
        });

        const widthX = 12;      
        const depthZ = 16;      
        const height = 6.5;     
        const elevation = 12;   
        const wingLength = 12;  
        const wingHalf = wingLength / 2;

        const geoNorteSur = new THREE.PlaneGeometry(widthX, height);
        const geoEsteOeste = new THREE.PlaneGeometry(depthZ, height);

        const screenN = new THREE.Mesh(geoNorteSur, screenMat);
        screenN.position.set(0, elevation, -depthZ / 2);

        const screenS = new THREE.Mesh(geoNorteSur, screenMat);
        screenS.position.set(0, elevation, depthZ / 2);
        screenS.rotation.y = Math.PI;

        const screenE = new THREE.Mesh(geoEsteOeste, screenMat);
        screenE.position.set(widthX / 2, elevation, 0);
        screenE.rotation.y = -Math.PI / 2;

        const screenW = new THREE.Mesh(geoEsteOeste, screenMat);
        screenW.position.set(-widthX / 2, elevation, 0);
        screenW.rotation.y = Math.PI / 2;

        this.screensGroup.add(screenN, screenS, screenE, screenW);

        const wingGeo = new THREE.PlaneGeometry(wingLength, height);

        const wingNE = new THREE.Mesh(wingGeo, screenMat);
        wingNE.position.set((widthX / 2) + wingHalf * Math.cos(-Math.PI / 4), elevation, (-depthZ / 2) + wingHalf * Math.sin(-Math.PI / 4));
        wingNE.rotation.y = Math.PI / 4;

        const wingNW = new THREE.Mesh(wingGeo, screenMat);
        wingNW.position.set((-widthX / 2) + wingHalf * Math.cos(-3 * Math.PI / 4), elevation, (-depthZ / 2) + wingHalf * Math.sin(-3 * Math.PI / 4));
        wingNW.rotation.y = -Math.PI / 4;

        const wingSE = new THREE.Mesh(wingGeo, screenMat);
        wingSE.position.set((widthX / 2) + wingHalf * Math.cos(Math.PI / 4), elevation, (depthZ / 2) + wingHalf * Math.sin(Math.PI / 4));
        wingSE.rotation.y = -Math.PI / 4;

        const wingSW = new THREE.Mesh(wingGeo, screenMat);
        wingSW.position.set((-widthX / 2) + wingHalf * Math.cos(3 * Math.PI / 4), elevation, (depthZ / 2) + wingHalf * Math.sin(3 * Math.PI / 4));
        wingSW.rotation.y = Math.PI / 4;

        this.screensGroup.add(wingNE, wingNW, wingSE, wingSW);
        this.stadiumGroup.add(this.screensGroup);
    }

    createArmyBombOcean360() {
        const count = 12000; 
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const colorPurple = new THREE.Color('#7f00ff');

        let i = 0;
        
        while (i < count) {
            const x = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 110;
            const distCenter = Math.sqrt(x*x + z*z);
            let y = 0;
            let valid = false;

            if (distCenter < 12) continue; 
            if (Math.abs(x - z) < 6 && distCenter < 22) continue; 
            if (Math.abs(x + z) < 6 && distCenter < 22) continue; 

            if (Math.abs(x) < 23 && Math.abs(z) < 28) {
                y = 0.2 + Math.random() * 0.5;
                valid = true;
            }
            else if (Math.abs(x) < 26 && Math.abs(z) < 32) {
                continue; 
            }
            else {
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
        this.stadiumGroup.add(this.lightOcean);
    }

    initHTML() {
        // Contenedor UI superior con botones de salida y audio
        this.uiContainer = document.createElement('div');
        this.uiContainer.style.cssText = "position: absolute; top: 20px; left: 20px; z-index: 9999; display: flex; gap: 15px;";

        // Botón "VOLVER AL PASILLO"
        const btnVolver = document.createElement('button');
        btnVolver.innerText = "← VOLVER AL PASILLO";
        btnVolver.style.cssText = "display: none; padding: 12px 24px; font-family: 'Courier New', monospace; font-weight: bold; background: rgba(10, 0, 20, 0.8); color: #00d2ff; border: 2px solid #00d2ff; border-radius: 20px; cursor: pointer; box-shadow: 0 0 15px rgba(0,210,255,0.4); transition: all 0.3s;";
        this.returnButton = btnVolver;
        btnVolver.onmouseover = () => { btnVolver.style.background = '#00d2ff'; btnVolver.style.color = '#000000'; };
        btnVolver.onmouseout = () => { btnVolver.style.background = 'rgba(10, 0, 20, 0.8)'; btnVolver.style.color = '#00d2ff'; };
        btnVolver.addEventListener('click', () => { if (this.onReturnToLobby) this.onReturnToLobby(); });

        // Botón "ACTIVAR AUDIO & SHOW"
        const btnAudio = document.createElement('button');
        btnAudio.innerText = "ACTIVAR AUDIO";
        btnAudio.style.cssText = "padding: 12px 24px; font-family: 'Courier New', monospace; font-weight: bold; background: rgba(10, 0, 20, 0.8); color: #00ffaa; border: 2px solid #00ffaa; border-radius: 20px; cursor: pointer; box-shadow: 0 0 15px rgba(0,255,170,0.4); transition: all 0.3s;";
        
        btnAudio.onclick = () => {
            this.initAudioAnalyser();
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            this.video.muted = !this.video.muted;
            this.isAudioActive = !this.video.muted;

            this.pyrotechnics.setAudio(this.audioCtx, this.isAudioActive);

            if (this.isAudioActive) {
                btnAudio.innerText = "SILENCIAR";
                btnAudio.style.color = "#ff0055";
                btnAudio.style.borderColor = "#ff0055";
            } else {
                btnAudio.innerText = "ACTIVAR AUDIO";
                btnAudio.style.color = "#00ffaa";
                btnAudio.style.borderColor = "#00ffaa";
            }
        };

        const btnFireworks = document.createElement('button');
        btnFireworks.innerText = "TEST FUEGOS";
        btnFireworks.style.cssText = "padding: 12px 24px; font-family: 'Courier New', monospace; font-weight: bold; background: rgba(10, 0, 20, 0.8); color: #ffbe00; border: 2px solid #ffbe00; border-radius: 20px; cursor: pointer; box-shadow: 0 0 15px rgba(255,190,0,0.4); transition: all 0.3s;";
        btnFireworks.onmouseover = () => { btnFireworks.style.background = '#ffbe00'; btnFireworks.style.color = '#000000'; };
        btnFireworks.onmouseout = () => { btnFireworks.style.background = 'rgba(10, 0, 20, 0.8)'; btnFireworks.style.color = '#ffbe00'; };
        btnFireworks.onclick = async () => {
            await this.pyrotechnics.unlockAudio();
            this.pyrotechnics.startGrandShow();
        };

        const btnFinale = document.createElement('button');
        btnFinale.innerText = "VER FINAL";
        btnFinale.style.cssText = "padding: 12px 24px; font-family: 'Courier New', monospace; font-weight: bold; background: rgba(10, 0, 20, 0.8); color: #ff66b3; border: 2px solid #ff66b3; border-radius: 20px; cursor: pointer; box-shadow: 0 0 15px rgba(255,102,179,0.4); transition: all 0.3s;";
        btnFinale.onmouseover = () => { btnFinale.style.background = '#ff66b3'; btnFinale.style.color = '#000000'; };
        btnFinale.onmouseout = () => { btnFinale.style.background = 'rgba(10, 0, 20, 0.8)'; btnFinale.style.color = '#ff66b3'; };
        btnFinale.addEventListener('click', () => this.handleShowEnd());

        this.uiContainer.appendChild(btnVolver);
        this.uiContainer.appendChild(btnAudio);
        this.uiContainer.appendChild(btnFireworks);
        this.uiContainer.appendChild(btnFinale);
        document.body.appendChild(this.uiContainer);

        this.cameraControlsContainer = null;
    }

    update(time) {
        const videoTime = this.video?.currentTime || 0;

        this.updateBroadcastDirector(videoTime, time);

        // --- 1. CÁMARA CINEMÁTICA AUTOMÁTICA ---
        if (this.camera) {
            if (this.currentCameraMode === 'dron') {
                if (this.finaleCameraStarted) {
                    // Ascenso sincronizado con startGrandShow (158s): cubre todo el show pirotécnico
                    const radius = 72;
                    const ascend = Math.min((videoTime - 158) / 6, 1);
                    const droneHeight = THREE.MathUtils.lerp(36, 56, Math.max(ascend, 0));
                    this.targetCamPos.set(
                        Math.sin(time * 0.1) * radius,
                        droneHeight + Math.sin(time * 0.25) * 1.5,
                        Math.cos(time * 0.1) * radius
                    );
                    this.targetLookAt.set(0, 18, 0);
                } else {
                    // Intro: bajada lenta para establecer la escala del estadio
                    const radius = 68;
                    const descent = Math.min(videoTime / 15, 1);
                    const droneHeight = THREE.MathUtils.lerp(48, 32, descent);
                    this.targetCamPos.set(
                        Math.sin(time * 0.12) * radius,
                        droneHeight + Math.sin(time * 0.3) * 2,
                        Math.cos(time * 0.12) * radius
                    );
                    this.targetLookAt.set(0, 4, 0);
                }

            } else if (this.currentCameraMode === 'vip') {
                this.targetCamPos.set(
                    Math.sin(time * 1.7) * 0.35,
                    3 + Math.sin(time * 2.1) * 0.2,
                    25 + Math.cos(time * 1.3) * 0.3
                );
                this.targetLookAt.set(0, 10, 0);

            } else if (this.currentCameraMode === 'escenario') {
                const panX = Math.sin(time * 0.5) * 30;
                this.targetCamPos.set(Math.sin(time * 0.35) * 5, 4, 9);
                this.targetLookAt.set(panX, 2, 40);

            } else if (this.currentCameraMode === 'cercano') {
                // Paneo cercano: público/pista con bamboleo sutil
                const swayX = Math.sin(time * 0.9) * 0.2;
                const swayY = Math.sin(time * 1.1) * 0.12;
                this.targetCamPos.set(
                    14 + Math.sin(time * 0.28) * 4 + swayX,
                    2.4 + swayY,
                    8 + Math.cos(time * 0.22) * 3
                );
                this.targetLookAt.set(Math.sin(time * 0.35) * 6, 3.5, 0);
            }

            const lerpSpeed = this.finaleCameraStarted ? 0.06 : 0.03;
            this.camera.position.lerp(this.targetCamPos, lerpSpeed);
            this.currentLookAt.lerp(this.targetLookAt, this.finaleCameraStarted ? 0.055 : 0.04);
            this.camera.lookAt(this.currentLookAt);
        }

        // --- 2. ACTUALIZACIÓN DE PIROTECNIA ---
        if (this.pyrotechnics && !this.showEnded) {
            this.pyrotechnics.update(0.016);
        }

        // --- 3. SINCRONIZACIÓN DE LUCES ARMY BOMB CON FRECUENCIAS DE AUDIO ---
        if (this.lightOcean) {
            const colorsAttribute = this.lightOcean.geometry.attributes.color;

            let bassIntensity = 0;
            let trebleIntensity = 0;

            if (this.analyser && this.isAudioActive) {
                this.analyser.getByteFrequencyData(this.dataArray);
                
                // Promedio de frecuencias bajas (Bajos/Batería, Bins 1 a 4)
                bassIntensity = (this.dataArray[1] + this.dataArray[2] + this.dataArray[3] + this.dataArray[4]) / (4 * 255);
                // Promedio de frecuencias altas (Sintetizadores/Voz, Bins 12 a 18)
                trebleIntensity = (this.dataArray[12] + this.dataArray[14] + this.dataArray[16]) / (3 * 255);
            }

            if (this.showEnded) {
                this.updateBlackoutLights(time, colorsAttribute);
            } else {
                this.updateShowLights(time, colorsAttribute);
            }
            colorsAttribute.needsUpdate = true;
        }
    }

    updateBroadcastDirector(videoTime, time) {
        if (this.showEnded) return;

        // 2:38 — pirotecnia + dron asciende a la vez para ver todo el show
        if (videoTime >= 158 && !this.grandShowStarted) {
            this.grandShowStarted = true;
            this.finaleCameraStarted = true;
            this.currentCameraMode = 'dron';
            this.pyrotechnics.startGrandShow();
        }

        if (this.finaleCameraStarted) {
            this.currentCameraMode = 'dron';
        } else if (videoTime < 15) {
            // 0:00–0:15 — dron bajando para establecer escala
            this.currentCameraMode = 'dron';
        } else {
            // 0:15–2:38 — rota VIP / Escenario / Cercano cada 12s
            const segment = Math.floor((videoTime - 15) / 12) % 3;
            this.currentCameraMode = ['vip', 'escenario', 'cercano'][segment];
        }
    }

    updateShowLights(time, colorsAttribute) {
        let bassIntensity = 0;
        let trebleIntensity = 0;

        if (this.analyser && this.isAudioActive) {
            this.analyser.getByteFrequencyData(this.dataArray);
            bassIntensity = (this.dataArray[1] + this.dataArray[2] + this.dataArray[3] + this.dataArray[4]) / (4 * 255);
            trebleIntensity = (this.dataArray[12] + this.dataArray[14] + this.dataArray[16]) / (3 * 255);
        }

        const cycle = Math.floor(time / 6) % 4;

        for (let i = 0; i < colorsAttribute.count; i++) {
            const wave = Math.sin(time * 3 + i * 0.02);

            if (this.isAudioActive && bassIntensity > 0.45 && Math.random() < bassIntensity) {
                colorsAttribute.setXYZ(i, 1.0, 1.0, 1.0);
            } else {
                if (cycle === 0) {
                    if (wave > 0.6) colorsAttribute.setXYZ(i, 1.0, 1.0, 1.0);
                    else colorsAttribute.setXYZ(i, 0.9, 0.0, 0.0);
                } else if (cycle === 1) {
                    if (wave > 0.6) colorsAttribute.setXYZ(i, 1.0, 1.0, 1.0);
                    else colorsAttribute.setXYZ(i, 0.0, 0.8, 0.5);
                } else if (cycle === 2) {
                    if (wave > 0.2) colorsAttribute.setXYZ(i, 0.9, 0.9, 1.0);
                    else colorsAttribute.setXYZ(i, 0.2, 0.2, 0.4);
                } else {
                    if (wave > 0.6) colorsAttribute.setXYZ(i, 1.0, 0.5, 1.0);
                    else colorsAttribute.setXYZ(i, 0.4, 0.0, 0.8);
                }
            }
        }
    }

    updateBlackoutLights(time, colorsAttribute) {
        const heartbeat = 0.5 + Math.pow((Math.sin(time * 0.9) + 1) / 2, 8) * 0.5;
        const pink = 0.24 + heartbeat * 0.28;
        this.pointsMaterial.opacity = 0.3 + heartbeat * 0.16;

        for (let i = 0; i < colorsAttribute.count; i++) {
            colorsAttribute.setXYZ(i, pink, pink * 0.12, pink * 0.3);
        }
    }

    handleShowEnd() {
        if (this.showEnded) return;
        this.showEnded = true;
        this.video.pause();
        this.video.currentTime = 173;

        this.screensGroup.children.forEach(screen => {
            screen.material.color.set('#000000');
        });

        this.pyrotechnics.stopAll();
        this.pyrotechnics.setAudioEnabled(false);
        this.returnButton.style.display = 'inline-block';
    }

    destroy() {
        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
        }

        if (this.video) {
            this.video.pause();
            this.video.src = '';
            this.video.load();
            this.video.remove();
        }

        if (this.pyrotechnics) {
            this.pyrotechnics.destroy();
        }

        this.scene.remove(this.stadiumGroup);

        if (this.uiContainer) {
            this.uiContainer.remove();
        }
        if (this.cameraControlsContainer) this.cameraControlsContainer.remove();
    }
}