import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Controls {
    constructor(camera, domElement) {
        // Inicializar los controles de órbita oficiales de Three.js
        this.instance = new OrbitControls(camera, domElement);
        
        // Configuración para que se sienta fluido y realista
        this.initConfiguration();
    }

    initConfiguration() {
        // Habilitar amortiguación (inercia) para que el movimiento sea suave al soltar el click
        this.instance.enableDamping = true;
        this.instance.dampingFactor = 0.05;

        // Restricciones para que el usuario no se "salga" del estadio ni atraviese el suelo
        this.instance.minDistance = 2;   // Qué tanto zoom-in puede hacer
        this.instance.maxDistance = 60;  // Qué tanto zoom-out puede hacer

        // Limitar el ángulo vertical (no poder ver debajo del suelo)
        this.instance.maxPolarAngle = Math.PI / 2 - 0.05; // Bloquea justo antes de tocar el suelo
    }

    // Este método lo llamaremos dentro del bucle de animación (tick) para actualizar la física de la inercia
    update() {
        this.instance.update();
    }
}