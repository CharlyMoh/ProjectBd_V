import * as THREE from 'three';
import { SceneManager } from './Core/SceneManager.js';
import { AudioContextManager } from './Effects/AudioContext.js';
import { BirthdayLobby } from './World/BirthdayLobby.js';

// --- ELEMENTOS DEL ESTADIO (Comentados temporalmente) ---
// import { Stadium } from './World/Stadium.js';
// import { ScreenStage } from './World/ScreenStage.js';
// import { LightsManager } from './Effects/LightsManager.js';

const canvas = document.querySelector('canvas.webgl');
const uiContainer = document.getElementById('ui-container');
const btnEntrar = document.getElementById('btn-entrar');

const sceneManager = new SceneManager(canvas);

// --- CÁMARA ORTOGRÁFICA (2D PURO SIN PERSPECTIVA) ---
const aspect = window.innerWidth / window.innerHeight;
const viewSize = 14; 
sceneManager.camera = new THREE.OrthographicCamera(
    (viewSize * aspect) / -2, 
    (viewSize * aspect) / 2, 
    viewSize / 2, 
    viewSize / -2, 
    0.1, 
    100
);
sceneManager.camera.position.set(0, 1.5, 10);
sceneManager.camera.lookAt(0, 1.5, 0);

// --- BLOQUEO TOTAL DE CONTROLES DEL RATÓN ---
if (sceneManager.controls) {
    sceneManager.controls.enabled = false;
    sceneManager.controls.enableZoom = false;   
    sceneManager.controls.enablePan = false;    
    sceneManager.controls.enableRotate = false; 
}

const audioManager = new AudioContextManager(sceneManager.camera);
const ambientLight = new THREE.AmbientLight('#ffffff', 1.2); 
sceneManager.scene.add(ambientLight);

const lobby = new BirthdayLobby(sceneManager.scene, sceneManager.camera);

// const screenStage = new ScreenStage();
// const stadium = new Stadium(sceneManager.scene, screenStage.texture);
// const lightsManager = new LightsManager(sceneManager.scene);

const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    if (lobby) lobby.update(elapsedTime);

    // if (stadium) stadium.update(elapsedTime);
    // if (lightsManager) lightsManager.update(elapsedTime);

    sceneManager.update();
    window.requestAnimationFrame(tick);
};

btnEntrar.addEventListener('click', () => {
    uiContainer.style.opacity = '0';
    setTimeout(() => { uiContainer.style.display = 'none'; }, 500);
    tick();

    // screenStage.play();
    // audioManager.initAmbientAudio(sceneManager.scene);
});

// Ajustar la cámara ortográfica si se cambia el tamaño de la ventana
window.addEventListener('resize', () => {
    const newAspect = window.innerWidth / window.innerHeight;
    sceneManager.camera.left = -viewSize * newAspect / 2;
    sceneManager.camera.right = viewSize * newAspect / 2;
    sceneManager.camera.top = viewSize / 2;
    sceneManager.camera.bottom = -viewSize / 2;
    sceneManager.camera.updateProjectionMatrix();
});