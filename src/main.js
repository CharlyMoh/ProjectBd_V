import * as THREE from 'three';
import { SceneManager } from './Core/SceneManager.js';
import { BirthdayLobby } from './World/BirthdayLobby.js';
import { LetterScene } from './World/LetterScene.js'; // IMPORTAMOS LA NUEVA ESCENA

const canvas = document.querySelector('canvas.webgl');
const uiContainer = document.getElementById('ui-container');
const btnEntrar = document.getElementById('btn-entrar');

const sceneManager = new SceneManager(canvas);

const aspect = window.innerWidth / window.innerHeight;

// --- CÁMARA 2D PARA EL PASILLO ---
const viewSize = 14; 
const orthoCamera = new THREE.OrthographicCamera(
    (viewSize * aspect) / -2, (viewSize * aspect) / 2, 
    viewSize / 2, viewSize / -2, 0.1, 100
);
orthoCamera.position.set(0, 1.5, 10);
orthoCamera.lookAt(0, 1.5, 0);

// --- CÁMARA 3D PARA EL UNIVERSO ---
const perspCamera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
perspCamera.position.set(0, 0, 30);

// Inicializamos con la cámara 2D
sceneManager.camera = orthoCamera;

if (sceneManager.controls) {
    sceneManager.controls.enabled = false;
}

const ambientLight = new THREE.AmbientLight('#ffffff', 1.2); 
sceneManager.scene.add(ambientLight);

// Instancias de nuestras escenas
let lobby = new BirthdayLobby(sceneManager.scene, sceneManager.camera);
let letterScene = null;

// EVENTO: Transición del Pasillo al Universo
lobby.onEnterLetter = () => {
    // Escondemos el pasillo
    lobby.lobbyGroup.visible = false;
    
    // Cambiamos a la cámara 3D
    sceneManager.camera = perspCamera;
    
    // Creamos el universo de partículas
    letterScene = new LetterScene(sceneManager.scene, sceneManager.camera);
    
    // Evento por si queremos volver de la carta al pasillo
    letterScene.onReturnToLobby = () => {
        letterScene.destroy();
        letterScene = null;
        sceneManager.camera = orthoCamera;
        lobby.lobbyGroup.visible = true;
        lobby.isTransitioning = false; // Permitir presionar puertas de nuevo
        // Resetear posición de personaje ligeramente para que no active la puerta al instante
        lobby.player.position.x += 2; 
    };
};

const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    if (lobby && lobby.lobbyGroup.visible) {
        lobby.update(elapsedTime);
    }
    
    if (letterScene) {
        letterScene.update(elapsedTime);
    }

    sceneManager.update();
    window.requestAnimationFrame(tick);
};

btnEntrar.addEventListener('click', () => {
    uiContainer.style.opacity = '0';
    setTimeout(() => { uiContainer.style.display = 'none'; }, 500);
    tick();
});