import * as THREE from 'three';

export class BirthdayLobby {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera; 
        
        this.lobbyGroup = new THREE.Group();
        this.scene.add(this.lobbyGroup);

        this.keys = { left: false, right: false, up: false };
        this.balloons = [];
        
        this.currentRoom = 0;
        this.rooms = []; 
        
        // Banderas de control de estado y transiciones
        this.isCardOpen = false;       
        this.isPromptVisible = false;   
        this.isTransitioning = false;
        this.onEnterLetter = null; // Callback vinculado con main.js

        this.textureLoader = new THREE.TextureLoader();

        this.balloonTextures = [
            this.loadPixelTexture('/blue-ballon.png'),
            this.loadPixelTexture('/green-ballon.png'),
            this.loadPixelTexture('/purple-ballon.png'),
            this.loadPixelTexture('/yellow-ballon.png')
        ];

        this.createEnvironment(); 
        this.createRoom0();       
        this.createRoom1();       
        this.createRoom2();       
        
        this.createPlayer();
        
        // Crear el indicador interactivo (Inicia oculto)
        this.createInteractionPromptLabel(); 
        
        this.updateRoomVisibility(); 
        
        this.initControls();
    }

    loadPixelTexture(path) {
        const tex = this.textureLoader.load(path);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    createEnvironment() {
        const wallGeo = new THREE.PlaneGeometry(150, 30);
        const wallMat = new THREE.MeshBasicMaterial({ color: '#000000' });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(0, 2, -5);
        this.lobbyGroup.add(wall);

        const borderGeo = new THREE.PlaneGeometry(150, 0.4);
        const borderMat = new THREE.MeshBasicMaterial({ color: '#888888' });
        
        const borderTop = new THREE.Mesh(borderGeo, borderMat);
        borderTop.position.set(0, 7.5, -4);
        this.lobbyGroup.add(borderTop);

        const borderBottom = new THREE.Mesh(borderGeo, borderMat);
        borderBottom.position.set(0, -3.26, -4);
        this.lobbyGroup.add(borderBottom);
    }

    buildTableScene(group, offsetX, leftKidPath, rightKidPath) {
        const tableCakeTex = this.loadPixelTexture('/tableAndCake.png');
        const tableCakeMat = new THREE.MeshBasicMaterial({ map: tableCakeTex, transparent: true, alphaTest: 0.5 });
        
        const tableCake = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 6.27), tableCakeMat);
        tableCake.position.set(offsetX, 0.10, -1.0); 
        group.add(tableCake);

        const kidGeo = new THREE.PlaneGeometry(2.1, 3.15);
        const kidY = -1.5; 

        if (leftKidPath) {
            const kidLMat = new THREE.MeshBasicMaterial({ map: this.loadPixelTexture(leftKidPath), transparent: true, alphaTest: 0.5 });
            const kidL = new THREE.Mesh(kidGeo, kidLMat);
            kidL.position.set(offsetX - 4.1, kidY, -0.5); 
            group.add(kidL);
        }

        if (rightKidPath) {
            const kidRMat = new THREE.MeshBasicMaterial({ map: this.loadPixelTexture(rightKidPath), transparent: true, alphaTest: 0.5 });
            const kidR = new THREE.Mesh(kidGeo, kidRMat);
            kidR.position.set(offsetX + 4.1, kidY, -0.5); 
            group.add(kidR);
        }

        // GLOBOS habituales de las salas 0 y 1
        const balloonPositionsX = [-4.5, -2.2, 0, 2.2, 4.5]; 
        const balloonHeightsY = [4.2, 4.5, 5.0, 4.5, 4.2]; 

        for(let b = 0; b < 5; b++) {
            const randomBalloonTex = this.balloonTextures[Math.floor(Math.random() * this.balloonTextures.length)];
            const bMat = new THREE.MeshBasicMaterial({ map: randomBalloonTex, transparent: true, alphaTest: 0.5 });
            const balloon = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), bMat);
            
            balloon.position.set(offsetX + balloonPositionsX[b], balloonHeightsY[b], -1.0);
            group.add(balloon);
            this.balloons.push({ mesh: balloon, offset: Math.random() * Math.PI * 2 });
        }
    }

    createRoom0() {
        const room = new THREE.Group();
        this.buildTableScene(room, 0, '/The green-masked kid.png', '/The pink-masked kid.png');
        this.lobbyGroup.add(room);
        this.rooms.push(room);
    }

    createRoom1() {
        const room = new THREE.Group();
        this.buildTableScene(room, -6.5, '/The purple-masked kid.png', '/The blue-masked kid.png');
        this.buildTableScene(room, 6.5, '/The orange-masked kid.png', null);
        this.lobbyGroup.add(room);
        this.rooms.push(room);
    }

    createRoom2() {
        const room = new THREE.Group();
        this.addTextLabel(room, "ELIGE UNA PUERTA!", 0, 3.5);
        const doorTex = this.loadPixelTexture('/door.png');
        const doorGeo = new THREE.PlaneGeometry(3, 4.1);

        // Puerta 1
        const doorLeftMat = new THREE.MeshBasicMaterial({ map: doorTex, transparent: true, alphaTest: 0.5 });
        this.doorLetter = new THREE.Mesh(doorGeo, doorLeftMat);
        this.doorLetter.position.set(-4, -1.0, -1.0);
        room.add(this.doorLetter);
        this.addTextLabel(room, "CARTA", -4, 1.5);

        // Puerta 2
        const doorRightMat = new THREE.MeshBasicMaterial({ map: doorTex, transparent: true, alphaTest: 0.5 });
        this.doorStadium = new THREE.Mesh(doorGeo, doorRightMat);
        this.doorStadium.position.set(4, -1.0, -1.0);
        room.add(this.doorStadium);
        this.addTextLabel(room, "CONCIERTO", 4, 1.5);

        // --- TUS POSICIONES DE GLOBOS PREFERIDAS PARA LA ROOM 2 ---
        const balloonPositionsX = [-9, -6, -2, 2, 6, 9]; 
        const balloonHeightsY = [4.5, 5.1, 5.6, 5.7, 4.2, 4.8]; 

        for(let b = 0; b < balloonPositionsX.length; b++) {
            const randomBalloonTex = this.balloonTextures[Math.floor(Math.random() * this.balloonTextures.length)];
            const bMat = new THREE.MeshBasicMaterial({ map: randomBalloonTex, transparent: true, alphaTest: 0.5 });
            const balloon = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), bMat);
            
            balloon.position.set(balloonPositionsX[b], balloonHeightsY[b], -1.0);
            room.add(balloon);
            this.balloons.push({ mesh: balloon, offset: Math.random() * Math.PI * 2 });
        }

        this.lobbyGroup.add(room);
        this.rooms.push(room);
    }

    addTextLabel(group, text, xPos, yPos = 2.0) {
        const canvas = document.createElement('canvas');
        canvas.width = 520; 
        canvas.height = 64;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        // Centrado exacto dividiendo el ancho del canvas (520 / 2 = 260)
        ctx.fillText(text, 260, 40);

        const tex = new THREE.CanvasTexture(canvas);
        const label = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 1), 
            new THREE.MeshBasicMaterial({ map: tex, transparent: true })
        );

        label.position.set(xPos, yPos, -1.0);
        group.add(label);
    }

    createInteractionPromptLabel() {
        const canvas = document.createElement('canvas');
        canvas.width = 520;
        canvas.height = 64;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffde59'; // Tono amarillo interactivo nítido
        ctx.font = 'bold 30px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        ctx.fillText("PRESIONA ↑ O W", 260, 40);

        const tex = new THREE.CanvasTexture(canvas);
        this.interactionPromptLabel = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 1), 
            new THREE.MeshBasicMaterial({ map: tex, transparent: true })
        );
        
        // Al estar el personaje en Z = 1, colocamos el letrero flotando justo al frente (Z = 1.1)
        this.interactionPromptLabel.position.set(0, 0, 1.1);
        this.interactionPromptLabel.visible = false; 
        this.lobbyGroup.add(this.interactionPromptLabel);
    }

    createPlayer() {
        const playerTex = this.loadPixelTexture('/mainCharacter-girl.png');
        const playerGeo = new THREE.PlaneGeometry(2.2, 4.5);
        const playerMat = new THREE.MeshBasicMaterial({ map: playerTex, transparent: true, alphaTest: 0.5 });
        
        this.player = new THREE.Mesh(playerGeo, playerMat);
        // Posiciones exactas requeridas: Eje Z puesto en 1 para quedar delante de todo
        this.player.position.set(-13, -1.2, 1); 
        this.lobbyGroup.add(this.player);
    }

    updateRoomVisibility() {
        this.rooms.forEach((room, index) => {
            room.visible = (index === this.currentRoom);
        });
    }

    initControls() {
        window.addEventListener('keydown', (e) => {
            if (this.isCardOpen) return; 
            if (e.key === 'a' || e.key === 'ArrowLeft') this.keys.left = true;
            if (e.key === 'd' || e.key === 'ArrowRight') this.keys.right = true;
            if (e.key === 'w' || e.key === 'ArrowUp') this.keys.up = true;
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'a' || e.key === 'ArrowLeft') this.keys.left = false;
            if (e.key === 'd' || e.key === 'ArrowRight') this.keys.right = false;
            if (e.key === 'w' || e.key === 'ArrowUp') this.keys.up = false;
        });
    }

    update(time) {
        if (this.isCardOpen) return; 

        this.balloons.forEach((b) => {
            b.mesh.position.y += Math.sin(time * 2 + b.offset) * 0.005;
        });

        const speed = 0.20;
        if (this.keys.left) this.player.position.x -= speed;
        if (this.keys.right) this.player.position.x += speed;

        const screenEdge = 13.5; 

        if (this.player.position.x > screenEdge) {
            if (this.currentRoom < this.rooms.length - 1) {
                this.currentRoom++; 
                this.player.position.x = -screenEdge + 1; 
                this.updateRoomVisibility();
            } else {
                this.player.position.x = screenEdge; 
            }
        }
        
        if (this.player.position.x < -screenEdge) {
            if (this.currentRoom > 0) {
                this.currentRoom--; 
                this.player.position.x = screenEdge - 1; 
                this.updateRoomVisibility();
            } else {
                this.player.position.x = -screenEdge; 
            }
        }

        // Lógica de proximidad de puertas e indicadores interactivos
        this.isPromptVisible = false; 

        if (this.currentRoom === 2) {
            const distLetter = Math.abs(this.player.position.x - this.doorLetter.position.x);
            const distStadium = Math.abs(this.player.position.x - this.doorStadium.position.x);

            const interactionRange = 1.8;

            if (distLetter < interactionRange) {
                this.interactionPromptLabel.position.x = this.doorLetter.position.x;
                this.interactionPromptLabel.position.y = 2.0; 
                this.isPromptVisible = true;
                
                if (this.keys.up && !this.isTransitioning) {
                    this.isTransitioning = true; 
                    if(this.onEnterLetter) this.onEnterLetter(); 
                }
            } else if (distStadium < interactionRange) {
                this.interactionPromptLabel.position.x = this.doorStadium.position.x;
                this.interactionPromptLabel.position.y = 2.0; 
                this.isPromptVisible = true;
                
                if (this.keys.up) {
                    console.log("¡Cargando Estadio de BTS!");
                }
            }
        }

        this.interactionPromptLabel.visible = this.isPromptVisible;
    }

    destroy() {
        this.lobbyGroup.visible = false;
    }
}