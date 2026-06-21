import * as THREE from 'three';

export class AudioContextManager {
    constructor(camera) {
        this.camera = camera;
        
        // 1. Crear un Listener de audio global y añadirlo a la cámara (representa los oídos del usuario)
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);
    }

    // Método para inicializar el audio ambiental del público (gritos/aplausos)
    // Nota: Necesitarás un archivo corto de audio de ambiente en public/ambient-stadium.mp3 (Opcional)
    initAmbientAudio(scene) {
        const ambientSound = new THREE.Audio(this.listener);
        const audioLoader = new THREE.AudioLoader();

        audioLoader.load('/ambient-stadium.mp3', (buffer) => {
            ambientSound.setBuffer(buffer);
            ambientSound.setLoop(true);
            ambientSound.setVolume(0.3); // Volumen tenue para que no tape la música
            ambientSound.play();
        }, undefined, (err) => console.log("Audio de ambiente no encontrado, continuando sin él..."));
    }
}