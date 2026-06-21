import * as THREE from 'three';
import { SceneManager } from './Core/SceneManager.js';
import { Stadium } from './World/Stadium.js';
import { ScreenStage } from './World/ScreenStage.js';
import { LightsManager } from './Effects/LightsManager.js';
import { AudioContextManager } from './Effects/AudioContext.js';

const canvas = document.querySelector('canvas.webgl');
const uiContainer = document.getElementById('ui-container');
const btnEntrar = document.getElementById('btn-entrar');

const sceneManager = new SceneManager(canvas);

// Reposicionar cámara inicial para que tenga una hermosa vista aérea diagonal del 360°
sceneManager.camera.position.set(0, 18, 35);

const audioManager = new AudioContextManager(sceneManager.camera);
const ambientLight = new THREE.AmbientLight('#0a0515', 0.4);
sceneManager.scene.add(ambientLight);

// 1. Inicializar primero el gestor de la textura de video
const screenStage = new ScreenStage();

// 2. Pasar la textura al Stadium para que arme la cruz de pantallas flotantes
const stadium = new Stadium(sceneManager.scene, screenStage.texture);
const lightsManager = new LightsManager(sceneManager.scene);

const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    if (stadium) stadium.update(elapsedTime);
    if (lightsManager) lightsManager.update(elapsedTime);

    sceneManager.update();
    window.requestAnimationFrame(tick);
};

btnEntrar.addEventListener('click', () => {
    uiContainer.style.opacity = '0';
    setTimeout(() => { uiContainer.style.display = 'none'; }, 500);

    screenStage.play();
    audioManager.initAmbientAudio(sceneManager.scene);
    tick();
});