import * as THREE from 'three';

export class ScreenStage {
    constructor() {
        this.initVideoTexture();
    }

    initVideoTexture() {
        this.video = document.createElement('video');
        this.video.src = '/bts-concert.mp4';
        this.video.loop = true;
        this.video.muted = false;
        this.video.playsInline = true;
        this.video.crossOrigin = 'anonymous';

        this.texture = new THREE.VideoTexture(this.video);
        this.texture.colorSpace = THREE.SRGBColorSpace;
    }

    play() {
        if (this.video) {
            this.video.play().catch(err => console.warn("Esperando interacción:", err));
        }
    }
}