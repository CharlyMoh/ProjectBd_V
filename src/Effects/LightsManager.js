import * as THREE from 'three';

export class LightsManager {
    constructor(scene) {
        this.scene = scene;
        this.spotlights = [];
        this.createCircularLights();
    }

    createCircularLights() {
        const lightCount = 12; // 12 focos potentes alrededor del anillo central
        const radius = 7.5;    // Justo en el borde del escenario circular

        for (let i = 0; i < lightCount; i++) {
            const angle = (i / lightCount) * Math.PI * 2;
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius;

            const spotlight = new THREE.SpotLight(
                '#ffffff', // Empezamos en blanco, el color cambiará dinámicamente
                80,
                45,
                Math.PI / 7,
                0.6,
                1
            );
            spotlight.position.set(x, 0.8, z);

            const target = new THREE.Object3D();
            // Apuntan hacia arriba cruzándose en el centro sobre las pantallas
            target.position.set(-x * 0.5, 18, -z * 0.5); 
            this.scene.add(target);
            spotlight.target = target;

            this.spotlights.push({ 
                light: spotlight, 
                target: target, 
                angle: angle,
                basePos: new THREE.Vector3(x, 0.8, z)
            });
            this.scene.add(spotlight);
        }
    }

    update(time) {
        const cycle = Math.floor(time / 6) % 4;
        
        // Sincronizar colores de los focos con la fase del océano de las fotos
        let currentLightColor = new THREE.Color('#7f00ff');
        if (cycle === 0) currentLightColor.set('#ff0000'); // Luces rojas
        if (cycle === 1) currentLightColor.set('#00ffff'); // Luces cian
        if (cycle === 2) currentLightColor.set('#ffffff'); // Luces blancas

        this.spotlights.forEach((spot) => {
            spot.light.color = currentLightColor;

            // Movimiento dinámico de barrido aéreo cruzado
            spot.target.position.x = Math.sin(time + spot.angle) * 5;
            spot.target.position.z = Math.cos(time + spot.angle) * 5;

            // Parpadeo sutil estroboscópico
            spot.light.intensity = 60 + Math.sin(time * 8 + spot.angle) * 20;
        });
    }
}