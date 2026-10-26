import * as THREE from 'three';
import { SceneManager } from './Core/SceneManager.js';
import { BirthdayLobby } from './World/BirthdayLobby.js';
import { LetterScene } from './World/LetterScene.js'; 
import { Stadium } from './World/Stadium.js';
import { galaxyBackgroundReady, initGalaxyExperience } from './World/galaxyExperience.js';
import { assetPath } from './Core/assetPath.js';

const canvas = document.querySelector('canvas.webgl');
const uiContainer = document.getElementById('ui-container');
const timeElement = document.getElementById('real-time');

const sceneManager = new SceneManager(canvas);

const aspect = window.innerWidth / window.innerHeight;

// --- CÁMARAS ---

// 1. Cámara 2D para el pasillo
const viewSize = 14; 
const orthoCamera = new THREE.OrthographicCamera(
    (viewSize * aspect) / -2, (viewSize * aspect) / 2, 
    viewSize / 2, viewSize / -2, 0.1, 100
);
orthoCamera.position.set(0, 1.5, 10);
orthoCamera.lookAt(0, 1.5, 0);

// 2. Cámara 3D para el Universo y el Concierto
const perspCamera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);

sceneManager.camera = orthoCamera;

if (sceneManager.controls) {
    sceneManager.controls.enabled = false;
}

const ambientLight = new THREE.AmbientLight('#ffffff', 1.2); 
sceneManager.scene.add(ambientLight);

// Instancias de escenas
let lobby = new BirthdayLobby(sceneManager.scene, sceneManager.camera);
let letterScene = null;
let stadiumScene = null;
let galaxyExperience = null;

const ambientacionNave = new Audio(assetPath('assets/AmbientacionNave.m4a'));
ambientacionNave.loop = false;
ambientacionNave.preload = 'auto';
// Ajusta este valor entre 0 y 1 para probar el volumen de la ambientación de la nave.
ambientacionNave.volume = 0.40;

const cartaMusica = new Audio(assetPath('assets/cartaMusica.m4a'));
cartaMusica.loop = false;
cartaMusica.preload = 'auto';
// Ajusta este valor entre 0 y 1 para probar el volumen de la música de la carta.
cartaMusica.volume = 0.20;

function playAmbientacionNave() {
    ambientacionNave.currentTime = 0;
    ambientacionNave.play().catch((error) => {
        if (error.name === 'NotAllowedError') {
            console.info('La ambientación de la nave comenzará después de una interacción del usuario.');
            return;
        }

        console.error('No se pudo reproducir AmbientacionNave.m4a. Verifica que el archivo exista y sea compatible:', error);
    });
}

function stopAmbientacionNave() {
    ambientacionNave.pause();
    ambientacionNave.currentTime = 0;
}

function playCartaMusica() {
    cartaMusica.currentTime = 0;
    cartaMusica.play().catch((error) => {
        if (error.name === 'NotAllowedError') {
            console.info('La música de la carta requiere una interacción del usuario.');
            return;
        }

        console.error('No se pudo reproducir cartaMusica.m4a. Verifica que el archivo exista y sea compatible:', error);
    });
}

function stopCartaMusica() {
    cartaMusica.pause();
    cartaMusica.currentTime = 0;
}

function enterLetterScene() {
    perspCamera.position.set(0, 0, 30);
    perspCamera.lookAt(0, 0, 0);
    sceneManager.camera = perspCamera;

    letterScene = new LetterScene(sceneManager.scene, sceneManager.camera);
    letterScene.onMessageReceived = () => {
        stopAmbientacionNave();
        playCartaMusica();
    };

    letterScene.onReturnToLobby = () => {
        letterScene.destroy();
        letterScene = null;
        stopAmbientacionNave();
        stopCartaMusica();
        lobby.openLastGiftBox();
        sceneManager.camera = orthoCamera;
        lobby.lobbyGroup.visible = true;
        lobby.playAmbientMusic();
        lobby.isTransitioning = false;
        lobby.player.position.x += 2;
    };
}

function crossfadeGalaxyToLetter() {
    const veil = document.createElement('div');
    veil.style.cssText = `
        position: fixed;
        inset: 0;
        background-color: #ffffff;
        z-index: 20000;
        pointer-events: auto;
        opacity: 1;
        transition: background-color 1.6s ease-in-out, opacity 2.2s ease-in-out;
    `;
    document.body.appendChild(veil);

    galaxyExperience.destroy();
    galaxyExperience = null;
    canvas.style.display = '';
    enterLetterScene();

    if (letterScene.startBtn) {
        letterScene.startBtn.style.opacity = '0';
        letterScene.startBtn.style.transition = 'opacity 1.4s ease';
        letterScene.startBtn.style.pointerEvents = 'none';
    }

    requestAnimationFrame(() => {
        void veil.offsetHeight;

        setTimeout(() => {
            veil.style.backgroundColor = '#000000';
        }, 350);

        setTimeout(() => {
            veil.style.opacity = '0';
            // Inicia el contador de 2 segundos para mostrar el botón
            letterScene.show();
        }, 2100);

        setTimeout(() => {
            veil.remove();
        }, 4400);
    });
}

// --- EVENTO 1: Galaxia + Carta (Puerta 1) ---
lobby.onEnterLetter = async () => {
    lobby.pauseAmbientMusic();
    playAmbientacionNave();
    await galaxyBackgroundReady;
    lobby.lobbyGroup.visible = false;
    canvas.style.display = 'none';

    galaxyExperience = await initGalaxyExperience({
        mountNode: document.body,
        onComplete: () => {
            crossfadeGalaxyToLetter();
        },
    });
};

// --- EVENTO 2: Transición al Concierto de BTS (Puerta 2) ---
lobby.onEnterStadium = () => {
    lobby.pauseAmbientMusic();
    sceneManager.scene.fog = null;
    lobby.lobbyGroup.visible = false;
    
    sceneManager.camera = perspCamera;
    
    stadiumScene = new Stadium(sceneManager.scene, sceneManager.camera, 0.30);
    
    stadiumScene.onReturnToLobby = () => {
        stadiumScene.destroy();
        stadiumScene = null;
        lobby.openLastGiftBox();
        sceneManager.camera = orthoCamera;
        lobby.lobbyGroup.visible = true;
        lobby.playAmbientMusic();
        lobby.isTransitioning = false;
        lobby.player.position.x -= 2; 
    };
};

// Bucle principal de renderizado
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    if (lobby && lobby.lobbyGroup.visible) {
        lobby.update(elapsedTime);
    }
    
    if (letterScene) {
        letterScene.update(elapsedTime);
    }

    if (stadiumScene) {
        stadiumScene.update(elapsedTime);
    }

    if (!galaxyExperience) {
        sceneManager.update();
    }
    window.requestAnimationFrame(tick);
};

function setRealTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? `0${minutes}` : minutes;

    timeElement.innerText = `${hours}:${minutes} ${ampm}`;
}

setRealTime();

setTimeout(() => {
    tick();
    uiContainer.style.opacity = '0';

    setTimeout(() => {
        uiContainer.style.display = 'none';
    }, 3000);
}, 4000);