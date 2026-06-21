import * as THREE from 'three';
import { Controls } from './Controls.js'; // NUEVO: Importar controles

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        this.initScene();
        this.initCamera();
        this.initRenderer();
        
        // NUEVO: Inicializar los controles pasando la cámara y el canvas
        this.controls = new Controls(this.camera, this.canvas);
        
        this.resize();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2('#050505', 0.015);
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 1000);
        this.camera.position.set(0, 5, 25);
        this.scene.add(this.camera);
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor('#050505');
    }

    resize() {
        window.addEventListener('resize', () => {
            this.sizes.width = window.innerWidth;
            this.sizes.height = window.innerHeight;

            this.camera.aspect = this.sizes.width / this.sizes.height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(this.sizes.width, this.sizes.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });
    }

    update() {
        // NUEVO: Actualizar los controles en cada frame para la inercia suave
        this.controls.update();

        this.renderer.render(this.scene, this.camera);
    }
}