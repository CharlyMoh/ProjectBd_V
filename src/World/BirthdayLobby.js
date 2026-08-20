import * as THREE from 'three';

// Estilos de BirthdayLobby documentados en style.css
const BIRTHDAY_COLORS = {
    WALL_BG: '#000000',           // Fondo de pared
    WALL_BORDER: '#888888',       // Bordes superior e inferior
    TEXT_DEFAULT: '#ffffff',      // Texto default (blanco)
    TEXT_INTERACTION: '#ffde59'   // Prompts interactivos (amarillo)
};

const BIRTHDAY_FONTS = {
    LABEL: 'bold 30px "Courier New", Courier, monospace',    // Etiquetas
    CONTROLS: 'bold 28px "Courier New", Courier, monospace'   // Controles
};

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
        this.onEnterStadium = null; // Callback vinculado con main.js

        this.textureLoader = new THREE.TextureLoader();

        this.balloonTextures = [
            this.loadPixelTexture('/assets/blue-ballon.png'),
            this.loadPixelTexture('/assets/green-ballon.png'),
            this.loadPixelTexture('/assets/purple-ballon.png'),
            this.loadPixelTexture('/assets/yellow-ballon.png'),
            this.loadPixelTexture('/assets/ballon.png')
        ];

        this.createEnvironment(); 
        this.createRoom0();       
        this.createRoom1();       
        this.createRoom2();       
        
        this.createPlayer();
        
        // Crear el indicador interactivo (Inicia oculto)
        this.createInteractionPromptLabel();
        
        // Crear controles de movimiento (arrows + mensaje)
        this.createMovementControlsHUD();
        
        // Flag para saber si el usuario ya ha visto los controles
        this.controlsVisible = true;
        this.playerStartX = -10; // Posición inicial del jugador
        
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

    shuffleArray(items) {
        const shuffled = [...items];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    getBalloonTextureGroup(groupSize) {
        const uniquePalette = this.shuffleArray(this.balloonTextures);

        if (groupSize <= uniquePalette.length) {
            return uniquePalette.slice(0, groupSize);
        }

        const repeatedColor = uniquePalette[Math.floor(Math.random() * uniquePalette.length)];
        const group = [...uniquePalette, repeatedColor];
        return this.shuffleArray(group).slice(0, groupSize);
    }

    createEnvironment() {
        const wallGeo = new THREE.PlaneGeometry(150, 30);
        const wallMat = new THREE.MeshBasicMaterial({ color: BIRTHDAY_COLORS.WALL_BG });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(0, 2, -5);
        this.lobbyGroup.add(wall);

        const borderGeo = new THREE.PlaneGeometry(150, 0.4);
        const borderMat = new THREE.MeshBasicMaterial({ color: BIRTHDAY_COLORS.WALL_BORDER });
        
        const borderTop = new THREE.Mesh(borderGeo, borderMat);
        borderTop.position.set(0, 7.5, -4);
        this.lobbyGroup.add(borderTop);

        const borderBottom = new THREE.Mesh(borderGeo, borderMat);
        borderBottom.position.set(0, -3.26, -4);
        this.lobbyGroup.add(borderBottom);
    }

    buildTableScene(group, offsetX, leftKidPath, rightKidPath) {
        const tableCakeTex = this.loadPixelTexture('/assets/tableAndCake.png');
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
        const balloonTextures = this.getBalloonTextureGroup(balloonPositionsX.length);

        for(let b = 0; b < balloonPositionsX.length; b++) {
            const bMat = new THREE.MeshBasicMaterial({ map: balloonTextures[b], transparent: true, alphaTest: 0.5 });
            const balloon = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), bMat);
            
            balloon.position.set(offsetX + balloonPositionsX[b], balloonHeightsY[b], -1.0);
            group.add(balloon);
            this.balloons.push({ mesh: balloon, offset: Math.random() * Math.PI * 2 });
        }
    }

    createRoom0() {
        const room = new THREE.Group();
        this.buildTableScene(room, 0, '/assets/The green-masked kid.png', '/assets/The pink-masked kid.png');

        const birthdayNumberGeometry = new THREE.PlaneGeometry(2.4, 2.65);
        const numberTwo = new THREE.Mesh(
            birthdayNumberGeometry,
            new THREE.MeshBasicMaterial({
                map: this.loadPixelTexture('/assets/2_ballon.png'),
                transparent: true,
                alphaTest: 0.5
            })
        );
        numberTwo.position.set(7.8, 2.6, -1.0);
        room.add(numberTwo);
        this.balloons.push({ mesh: numberTwo, offset: Math.random() * Math.PI * 2, smooth: true });

        const numberZero = new THREE.Mesh(
            birthdayNumberGeometry,
            new THREE.MeshBasicMaterial({
                map: this.loadPixelTexture('/assets/0_ballon.png'),
                transparent: true,
                alphaTest: 0.5
            })
        );
        numberZero.position.set(10.4, 2.6, -1.0);
        room.add(numberZero);
        this.balloons.push({ mesh: numberZero, offset: Math.random() * Math.PI * 2, smooth: true });

        this.lobbyGroup.add(room);
        this.rooms.push(room);
    }

    createRoom1() {
        const room = new THREE.Group();
        this.buildTableScene(room, -6.5, '/assets/The purple-masked kid.png', '/assets/The blue-masked kid.png');
        this.buildTableScene(room, 6.5, '/assets/The orange-masked kid.png', null);
        this.lobbyGroup.add(room);
        this.rooms.push(room);
    }

    createRoom2() {
        const room = new THREE.Group();
        this.addTextLabel(room, "ELIGE UNA PUERTA", 0, 3.5);
        const doorTex = this.loadPixelTexture('/assets/door.png');
        const doorGeo = new THREE.PlaneGeometry(3, 4.5);

        // Puerta 1
        const doorLeftMat = new THREE.MeshBasicMaterial({ map: doorTex, transparent: true, alphaTest: 0.5 });
        this.doorLetter = new THREE.Mesh(doorGeo, doorLeftMat);
        this.doorLetter.position.set(-4, -0.80, -1.0);
        room.add(this.doorLetter);
        this.addTextLabel(room, "1", -4, 1.5);

        // Puerta 2
        const doorRightMat = new THREE.MeshBasicMaterial({ map: doorTex, transparent: true, alphaTest: 0.5 });
        this.doorStadium = new THREE.Mesh(doorGeo, doorRightMat);
        this.doorStadium.position.set(4, -0.80, -1.0);
        room.add(this.doorStadium);
        this.addTextLabel(room, "2", 4, 1.5);

        // --- TUS POSICIONES DE GLOBOS PREFERIDAS PARA LA ROOM 2: grupo simétrico de 6 ---
        const balloonPositionsX = [-9, -6, -2, 2, 6, 9]; 
        const balloonHeightsY = [4.5, 5.1, 5.9, 6.0, 4.2, 4.8]; 
        const balloonTextures = this.getBalloonTextureGroup(balloonPositionsX.length);

        for(let b = 0; b < balloonPositionsX.length; b++) {
            const bMat = new THREE.MeshBasicMaterial({ map: balloonTextures[b], transparent: true, alphaTest: 0.5 });
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
        ctx.fillStyle = BIRTHDAY_COLORS.TEXT_DEFAULT;
        ctx.font = BIRTHDAY_FONTS.LABEL;
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
        ctx.fillStyle = BIRTHDAY_COLORS.TEXT_INTERACTION; // Amarillo interactivo
        ctx.font = BIRTHDAY_FONTS.LABEL;
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

    createMovementControlsHUD() {
        // Grupo contenedor para las flechas y mensaje
        this.controlsGroup = new THREE.Group();
        this.controlsGroup.position.set(-10, 0, 0); // Posicionar el grupo en X = -10
        this.lobbyGroup.add(this.controlsGroup);

        // Crear mensaje "USE LEFT/RIGHT ARROWS TO MOVE"
        const msgCanvas = document.createElement('canvas');
        msgCanvas.width = 800;
        msgCanvas.height = 80;
        const ctx = msgCanvas.getContext('2d');
        ctx.fillStyle = BIRTHDAY_COLORS.TEXT_DEFAULT;
        ctx.font = BIRTHDAY_FONTS.CONTROLS;
        ctx.textAlign = 'center';
        ctx.fillText("USE LEFT/RIGHT ARROWS TO MOVE", 400, 50);

        const msgTex = new THREE.CanvasTexture(msgCanvas);
        this.controlsMessage = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 1.2),
            new THREE.MeshBasicMaterial({ map: msgTex, transparent: true })
        );
        this.controlsMessage.position.set(0, 3.5, 0); // Relativo al grupo
        this.controlsGroup.add(this.controlsMessage);

        // Flechas (posición relativa al grupo)
        const arrowSize = 1.3;
        const arrowSpacing = 1;

        // Flecha izquierda
        const leftArrowTex = this.loadPixelTexture('/assets/left.png');
        const leftArrowMat = new THREE.MeshBasicMaterial({ map: leftArrowTex, transparent: true, alphaTest: 0.5 });
        this.leftArrow = new THREE.Mesh(new THREE.PlaneGeometry(arrowSize, arrowSize), leftArrowMat);
        this.leftArrow.position.set(-arrowSpacing, 2, 0);
        this.controlsGroup.add(this.leftArrow);

        // Flecha derecha
        const rightArrowTex = this.loadPixelTexture('/assets/right.png');
        const rightArrowMat = new THREE.MeshBasicMaterial({ map: rightArrowTex, transparent: true, alphaTest: 0.5 });
        this.rightArrow = new THREE.Mesh(new THREE.PlaneGeometry(arrowSize, arrowSize), rightArrowMat);
        this.rightArrow.position.set(arrowSpacing, 2, 0);
        this.controlsGroup.add(this.rightArrow);

        // Estados de animación
        this.leftArrowScale = 1;
        this.rightArrowScale = 1;
        this.leftArrowAnimating = false;
        this.rightArrowAnimating = false;
    }

    createPlayer() {
        const playerTex = this.loadPixelTexture('/assets/mainCharacter-girl.png');
        const playerGeo = new THREE.PlaneGeometry(2.2, 4.5);
        const playerMat = new THREE.MeshBasicMaterial({ map: playerTex, transparent: true, alphaTest: 0.5 });
        
        this.player = new THREE.Mesh(playerGeo, playerMat);
        // Posiciones exactas requeridas: Eje Z puesto en 1 para quedar delante de todo
        this.player.position.set(-10, -1, 1); 
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
            if (b.smooth) {
                if (b.baseY === undefined) b.baseY = b.mesh.position.y;
                b.mesh.position.y = b.baseY + Math.sin(time * 2 + b.offset) * 0.04;
            } else {
                b.mesh.position.y += Math.sin(time * 2 + b.offset) * 0.005;
            }
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

        // Lógica de controles HUD - desaparecer cuando el jugador avance lo suficiente en la sala 0
        if (this.controlsVisible && this.currentRoom === 0) {
            const distanceTraveled = Math.abs(this.player.position.x - this.playerStartX);
            const hideDistance = 8; // A mitad de la sala aproximadamente
            
            if (distanceTraveled > hideDistance) {
                this.controlsVisible = false;
                this.controlsGroup.visible = false;
            }
        }

        // Animaciones de flechas cuando se presionan las teclas
        const animationSpeed = 0.15;
        const maxScale = 1.15;

        // Animación flecha izquierda
        if (this.keys.left && !this.leftArrowAnimating) {
            this.leftArrowAnimating = true;
        }
        
        if (this.leftArrowAnimating) {
            this.leftArrowScale += animationSpeed;
            if (this.leftArrowScale >= maxScale) {
                this.leftArrowScale = maxScale;
                this.leftArrowAnimating = false;
            }
        } else if (this.leftArrowScale > 1) {
            this.leftArrowScale -= animationSpeed * 0.5;
            if (this.leftArrowScale < 1) this.leftArrowScale = 1;
        }

        // Animación flecha derecha
        if (this.keys.right && !this.rightArrowAnimating) {
            this.rightArrowAnimating = true;
        }
        
        if (this.rightArrowAnimating) {
            this.rightArrowScale += animationSpeed;
            if (this.rightArrowScale >= maxScale) {
                this.rightArrowScale = maxScale;
                this.rightArrowAnimating = false;
            }
        } else if (this.rightArrowScale > 1) {
            this.rightArrowScale -= animationSpeed * 0.5;
            if (this.rightArrowScale < 1) this.rightArrowScale = 1;
        }

        // Aplicar escala a las flechas
        this.leftArrow.scale.set(this.leftArrowScale, this.leftArrowScale, 1);
        this.rightArrow.scale.set(this.rightArrowScale, this.rightArrowScale, 1);

        // Lógica de proximidad de puertas e indicadores interactivos
        this.isPromptVisible = false; 

        if (this.currentRoom === 2) {
            const distLetter = Math.abs(this.player.position.x - this.doorLetter.position.x);
            const distStadium = Math.abs(this.player.position.x - this.doorStadium.position.x);

            const interactionRange = 1.8;

            if (distLetter < interactionRange) {
                this.interactionPromptLabel.position.x = this.doorLetter.position.x;
                this.interactionPromptLabel.position.y = 2.3; 
                this.isPromptVisible = true;
                
                if (this.keys.up && !this.isTransitioning) {
                    this.isTransitioning = true; 
                    if(this.onEnterLetter) this.onEnterLetter(); 
                }
            } else if (distStadium < interactionRange) {
                this.interactionPromptLabel.position.x = this.doorStadium.position.x;
                this.interactionPromptLabel.position.y = 2.3; 
                this.isPromptVisible = true;
                
                if (this.keys.up && !this.isTransitioning) {
                    this.isTransitioning = true; 
                    if(this.onEnterStadium) this.onEnterStadium(); 
                }
            }
        }

        this.interactionPromptLabel.visible = this.isPromptVisible;
    }

    destroy() {
        this.lobbyGroup.visible = false;
    }
}