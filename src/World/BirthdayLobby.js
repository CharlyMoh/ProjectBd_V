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
        
        // Mantenemos techo alto (Y=5.5)
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

        // GLOBOS: Distribución mejorada
        const balloonPositionsX = [-4.5, -2.2, 0, 2.2, 4.5]; 
        const balloonHeightsY = [4.2, 4.5, 5.0, 4.5, 4.2]; // El central (índice 2) es más alto (5.0)

        for(let b = 0; b < 5; b++) {
            const randomBalloonTex = this.balloonTextures[Math.floor(Math.random() * this.balloonTextures.length)];
            const bMat = new THREE.MeshBasicMaterial({ map: randomBalloonTex, transparent: true, alphaTest: 0.5 });
            const balloon = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), bMat);
            
            // Usamos balloonHeightsY para que el del centro quede despejado
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
        const doorTex = this.loadPixelTexture('/door.png');
        const doorGeo = new THREE.PlaneGeometry(3, 4.1);

        // Puerta 1
        const doorLeftMat = new THREE.MeshBasicMaterial({ map: doorTex, transparent: true, alphaTest: 0.5 });
        this.doorLetter = new THREE.Mesh(doorGeo, doorLeftMat);
        this.doorLetter.position.set(-4, -1.0, -1.0);
        room.add(this.doorLetter);
        this.addTextLabel(room, "CARTA", -4);

        // Puerta 2
        const doorRightMat = new THREE.MeshBasicMaterial({ map: doorTex, transparent: true, alphaTest: 0.5 });
        this.doorStadium = new THREE.Mesh(doorGeo, doorRightMat);
        this.doorStadium.position.set(4, -1.0, -1.0);
        room.add(this.doorStadium);
        this.addTextLabel(room, "CONCIERTO", 4);

        this.lobbyGroup.add(room);
        this.rooms.push(room);
    }

    addTextLabel(group, text, xPos) {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(text, 128, 40);

        const tex = new THREE.CanvasTexture(canvas);
        const label = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 1), 
            new THREE.MeshBasicMaterial({ map: tex, transparent: true })
        );
        label.position.set(xPos, 2.0, -1.0);
        group.add(label);
    }

    createPlayer() {
        const playerTex = this.loadPixelTexture('/mainCharacter-girl.png');
        const playerGeo = new THREE.PlaneGeometry(2.2, 4.0);
        const playerMat = new THREE.MeshBasicMaterial({ map: playerTex, transparent: true, alphaTest: 0.5 });
        
        this.player = new THREE.Mesh(playerGeo, playerMat);
        this.player.position.set(-13, -1, -2.0); 
        this.lobbyGroup.add(this.player);
    }

    updateRoomVisibility() {
        this.rooms.forEach((room, index) => {
            room.visible = (index === this.currentRoom);
        });
    }

    initControls() {
        window.addEventListener('keydown', (e) => {
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
        this.balloons.forEach((b) => {
            b.mesh.position.y += Math.sin(time * 2 + b.offset) * 0.005;
        });

        const speed = 0.12;
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

        if (this.currentRoom === 2 && this.keys.up) {
            const distLetter = Math.abs(this.player.position.x - this.doorLetter.position.x);
            const distStadium = Math.abs(this.player.position.x - this.doorStadium.position.x);

            if (distLetter < 1.5) {
                console.log("¡Leyendo la Carta!");
            } else if (distStadium < 1.5) {
                console.log("¡Cargando Estadio de BTS!");
            }
        }
    }

    destroy() {
        this.lobbyGroup.visible = false;
    }
}