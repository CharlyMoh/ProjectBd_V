/**
 * Sonidos procedurales de fuegos artificiales vía Web Audio API.
 * Silbido de subida + boom/crackle de explosión + chispas de fuente.
 */
export class FireworkSFX {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.enabled = false;
        this.noiseBuffer = null;
    }

    attach(audioCtx) {
        if (!audioCtx) return;
        this.ctx = audioCtx;

        if (!this.master) {
            this.master = this.ctx.createGain();
            this.master.gain.value = 0.45;
            this.master.connect(this.ctx.destination);
        }

        if (!this.noiseBuffer) {
            this.noiseBuffer = this.createNoiseBuffer(1.5);
        }
    }

    setEnabled(enabled) {
        this.enabled = !!enabled;
        if (this.master && this.ctx) {
            const now = this.ctx.currentTime;
            this.master.gain.cancelScheduledValues(now);
            this.master.gain.setValueAtTime(enabled ? 0.45 : 0, now);
        }
    }

    createNoiseBuffer(durationSec) {
        const length = Math.floor(this.ctx.sampleRate * durationSec);
        const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playLaunch() {
        if (!this.canPlay()) return;

        const ctx = this.ctx;
        const now = ctx.currentTime;
        const dur = 0.7 + Math.random() * 0.45;

        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 8;
        filter.frequency.setValueAtTime(400 + Math.random() * 200, now);
        filter.frequency.exponentialRampToValueAtTime(1800 + Math.random() * 800, now + dur * 0.55);
        filter.frequency.exponentialRampToValueAtTime(600, now + dur);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.22, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        src.start(now);
        src.stop(now + dur + 0.05);
    }

    playExplosion(type = 'peony') {
        if (!this.canPlay()) return;

        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Boom grave
        const boom = ctx.createOscillator();
        boom.type = 'sine';
        const boomFreq = type === 'willow' ? 55 : type === 'ring' ? 90 : 70;
        boom.frequency.setValueAtTime(boomFreq + Math.random() * 20, now);
        boom.frequency.exponentialRampToValueAtTime(28, now + 0.35);

        const boomGain = ctx.createGain();
        const boomVol = type === 'willow' ? 0.28 : 0.4;
        boomGain.gain.setValueAtTime(0.001, now);
        boomGain.gain.exponentialRampToValueAtTime(boomVol, now + 0.01);
        boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        boom.connect(boomGain);
        boomGain.connect(this.master);
        boom.start(now);
        boom.stop(now + 0.45);

        // Crackle / ráfaga de ruido
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        const openFreq = type === 'ring' ? 4500 : type === 'willow' ? 2200 : 3200;
        filter.frequency.setValueAtTime(openFreq, now);
        filter.frequency.exponentialRampToValueAtTime(280, now + (type === 'willow' ? 1.1 : 0.55));

        const crackGain = ctx.createGain();
        const crackVol = type === 'willow' ? 0.2 : 0.32;
        const crackDur = type === 'willow' ? 1.2 : type === 'ring' ? 0.45 : 0.7;
        crackGain.gain.setValueAtTime(0.001, now);
        crackGain.gain.exponentialRampToValueAtTime(crackVol, now + 0.008);
        crackGain.gain.exponentialRampToValueAtTime(0.001, now + crackDur);

        src.connect(filter);
        filter.connect(crackGain);
        crackGain.connect(this.master);
        src.start(now);
        src.stop(now + crackDur + 0.05);

        // Micro-chispas aleatorias (crackle seco)
        if (type !== 'willow') {
            const pops = 3 + Math.floor(Math.random() * 4);
            for (let i = 0; i < pops; i++) {
                this.playPop(now + 0.04 + i * (0.03 + Math.random() * 0.05));
            }
        }
    }

    playFountain() {
        if (!this.canPlay()) return;

        const ctx = this.ctx;
        const now = ctx.currentTime;
        const dur = 1.4 + Math.random() * 0.4;

        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1800 + Math.random() * 600;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.08);
        gain.gain.setValueAtTime(0.1, now + dur * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        src.start(now);
        src.stop(now + dur + 0.05);
    }

    playPop(atTime) {
        const ctx = this.ctx;
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000 + Math.random() * 3000;
        filter.Q.value = 4;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, atTime);
        gain.gain.exponentialRampToValueAtTime(0.08, atTime + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, atTime + 0.06);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        src.start(atTime);
        src.stop(atTime + 0.08);
    }

    canPlay() {
        return this.enabled && this.ctx && this.master && this.noiseBuffer && this.ctx.state === 'running';
    }

    destroy() {
        this.enabled = false;
        if (this.master) {
            try {
                this.master.disconnect();
            } catch (_) { /* already disconnected */ }
            this.master = null;
        }
        this.noiseBuffer = null;
        this.ctx = null;
    }
}
