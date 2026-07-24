import * as THREE from 'three';
import { SceneManager } from './Core/SceneManager.js';
import { BirthdayLobby } from './World/BirthdayLobby.js';
import { LetterScene } from './World/LetterScene.js'; 
import { Stadium } from './World/Stadium.js';

const canvas = document.querySelector('canvas.webgl');
const uiContainer = document.getElementById('ui-container');
const btnEntrar = document.getElementById('btn-entrar');

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

// --- EVENTO 1: Transición a la Carta (Puerta Izquierda) ---
lobby.onEnterLetter = () => {
    lobby.lobbyGroup.visible = false;
    
    perspCamera.position.set(0, 0, 30);
    perspCamera.lookAt(0, 0, 0);
    sceneManager.camera = perspCamera;
    
    letterScene = new LetterScene(sceneManager.scene, sceneManager.camera);
    
    letterScene.onReturnToLobby = () => {
        letterScene.destroy();
        letterScene = null;
        sceneManager.camera = orthoCamera;
        lobby.lobbyGroup.visible = true;
        lobby.isTransitioning = false;
        lobby.player.position.x += 2; 
    };
};

// --- EVENTO 2: Transición al Concierto de BTS (Puerta Derecha) ---
// --- TRANSICIÓN AL CONCIERTO DE BTS (PUERTA DERECHA) ---
lobby.onEnterStadium = () => {
    sceneManager.scene.fog = null;
    lobby.lobbyGroup.visible = false;
    
    sceneManager.camera = perspCamera;
    
    // Le pasamos (scene, camera) a la instancia de Stadium
    stadiumScene = new Stadium(sceneManager.scene, sceneManager.camera);
    
    stadiumScene.onReturnToLobby = () => {
        stadiumScene.destroy();
        stadiumScene = null;
        sceneManager.camera = orthoCamera;
        lobby.lobbyGroup.visible = true;
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

    sceneManager.update();
    window.requestAnimationFrame(tick);
};

btnEntrar.addEventListener('click', () => {
    uiContainer.style.opacity = '0';
    setTimeout(() => { uiContainer.style.display = 'none'; }, 500);
    tick();
});