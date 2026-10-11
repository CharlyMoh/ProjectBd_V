/**
 * Fuegos artificiales procedurales más realistas:
 * silbido de cohete, boom grave, crackle de estrellas y eco de estadio.
 * No usa samples externos (no hay .mp3/.wav en el repo).
 */
export class FireworkSFX {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.reverb = null;
        this.enabled = false;
        this.whiteBuffer = null;
        this.pinkBuffer = null;
        this.impulseBuffer = null;
        this.effectBuffers = [null, null, null];
        this.effectsLoadPromise = null;
    }

    unlock() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return Promise.resolve();

        if (!this.ctx || this.ctx.state === 'closed') {
            this.ctx = new AudioContext();

            this.master = this.ctx.createGain();
            this.master.gain.value = 0.9;

            const compressor = this.ctx.createDynamicsCompressor();
            compressor.threshold.value = -16;
            compressor.knee.value = 18;
            compressor.ratio.value = 5;
            compressor.attack.value = 0.002;
            compressor.release.value = 0.22;

            this.reverb = this.ctx.createConvolver();
            this.whiteBuffer = this.createNoiseBuffer(2, 'white');
            this.pinkBuffer = this.createNoiseBuffer(2, 'pink');
            this.impulseBuffer = this.createStadiumImpulse(2.4);
            this.reverb.buffer = this.impulseBuffer;

            this.master.connect(compressor);
            compressor.connect(this.ctx.destination);
            this.reverb.connect(this.ctx.destination);
        }

        if (!this.effectsLoadPromise) {
            this.effectsLoadPromise = Promise.all(
                ['/assets/efecto1.wav', '/assets/efecto2.wav', '/assets/efecto3.wav'].map(async (url, index) => {
                    try {
                        const response = await fetch(url);
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        this.effectBuffers[index] = await this.ctx.decodeAudioData(await response.arrayBuffer());
                    } catch (error) {
                        console.warn(`No se pudo cargar ${url}:`, error);
                    }
                })
            );
        }

        const resumePromise = this.ctx.state === 'suspended'
            ? this.ctx.resume().catch(() => {})
            : Promise.resolve();
        return Promise.all([resumePromise, this.effectsLoadPromise]).then(() => {});
    }

    attach(audioCtx) {
        this.unlock();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
    }

    setEnabled(enabled) {
        this.enabled = !!enabled;
        this.unlock();
        if (this.master && this.ctx) {
            const now = this.ctx.currentTime;
            this.master.gain.cancelScheduledValues(now);
            this.master.gain.setValueAtTime(enabled ? 0.9 : 0, now);
        }
        if (enabled && this.ctx?.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    createNoiseBuffer(durationSec, type = 'white') {
        const length = Math.floor(this.ctx.sampleRate * durationSec);
        const buffer = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < length; i++) {
                const white = Math.random() * 2 - 1;
                if (type === 'pink') {
                    b0 = 0.99886 * b0 + white * 0.0555179;
                    b1 = 0.99332 * b1 + white * 0.0750759;
                    b2 = 0.96900 * b2 + white * 0.1538520;
                    b3 = 0.86650 * b3 + white * 0.3104856;
                    b4 = 0.55000 * b4 + white * 0.5329522;
                    b5 = -0.7616 * b5 - white * 0.0168980;
                    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                    b6 = white * 0.115926;
                } else {
                    data[i] = white;
                }
            }
        }
        return buffer;
    }

    createStadiumImpulse(durationSec) {
        const rate = this.ctx.sampleRate;
        const length = Math.floor(rate * durationSec);
        const impulse = this.ctx.createBuffer(2, length, rate);
        for (let ch = 0; ch < 2; ch++) {
            const data = impulse.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                const t = i / length;
                const decay = Math.pow(1 - t, 2.2);
                data[i] = (Math.random() * 2 - 1) * decay * 0.35;
            }
        }
        return impulse;
    }

    noiseSource(buffer, loop = true) {
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = loop;
        return src;
    }

    sendToReverb(node, amount) {
        const wet = this.ctx.createGain();
        wet.gain.value = amount;
        node.connect(wet);
        wet.connect(this.reverb);
    }

    panTo(node, panValue) {
        const pan = this.ctx.createStereoPanner();
        pan.pan.value = Math.max(-0.85, Math.min(0.85, panValue));
        node.connect(pan);
        pan.connect(this.master);
        return pan;
    }

    playLaunch(type = 'peony') {
        if (!this.canPlay()) return;
        const effectIndex = type === 'peony' ? 2 : Math.floor(Math.random() * 2);
        if (this.playEffect(effectIndex, 0.07)) return;

        const ctx = this.ctx;
        const now = ctx.currentTime;
        const dur = 0.85 + Math.random() * 0.35;
        const pan = (Math.random() - 0.5) * 1.2;

        // Silbido tonal del cohete
        const whistle = ctx.createOscillator();
        whistle.type = 'sine';
        const startF = 620 + Math.random() * 180;
        const peakF = 2100 + Math.random() * 700;
        whistle.frequency.setValueAtTime(startF, now);
        whistle.frequency.linearRampToValueAtTime(peakF, now + dur * 0.72);
        whistle.frequency.linearRampToValueAtTime(peakF * 0.72, now + dur);

        const whistleFilter = ctx.createBiquadFilter();
        whistleFilter.type = 'bandpass';
        whistleFilter.Q.value = 14;
        whistleFilter.frequency.setValueAtTime(startF, now);
        whistleFilter.frequency.linearRampToValueAtTime(peakF, now + dur * 0.72);

        const whistleGain = ctx.createGain();
        whistleGain.gain.setValueAtTime(0.0001, now);
        whistleGain.gain.linearRampToValueAtTime(0.22, now + 0.08);
        whistleGain.gain.linearRampToValueAtTime(0.16, now + dur * 0.7);
        whistleGain.gain.linearRampToValueAtTime(0.0001, now + dur);

        whistle.connect(whistleFilter);
        whistleFilter.connect(whistleGain);
        this.panTo(whistleGain, pan);
        this.sendToReverb(whistleGain, 0.12);
        whistle.start(now);
        whistle.stop(now + dur + 0.02);

        // Aire / whoosh
        const air = this.noiseSource(this.pinkBuffer);
        const airFilter = ctx.createBiquadFilter();
        airFilter.type = 'bandpass';
        airFilter.Q.value = 2.2;
        airFilter.frequency.setValueAtTime(400, now);
        airFilter.frequency.linearRampToValueAtTime(1800, now + dur);

        const airGain = ctx.createGain();
        airGain.gain.setValueAtTime(0.0001, now);
        airGain.gain.linearRampToValueAtTime(0.28, now + 0.12);
        airGain.gain.linearRampToValueAtTime(0.0001, now + dur);

        air.connect(airFilter);
        airFilter.connect(airGain);
        this.panTo(airGain, pan);
        air.start(now);
        air.stop(now + dur + 0.02);
    }

    playExplosion(type = 'peony') {
        if (!this.canPlay()) return;
        if (this.playEffect(2, 0.07)) return;

        const ctx = this.ctx;
        const now = ctx.currentTime;
        const pan = (Math.random() - 0.5) * 1.4;
        const isWillow = type === 'willow';
        const isRing = type === 'ring';

        this.playThump(now, pan, isWillow ? 0.45 : isRing ? 0.55 : 0.7);
        this.playBurstBody(now, pan, type);
        this.playCrackles(now, pan, type);
        this.playEchoSlap(now, pan);
    }

    playEffect(index, volume) {
        const buffer = this.effectBuffers[index];
        if (!buffer || !this.canPlay()) return false;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.value = volume;
        source.connect(gain);
        this.panTo(gain, (Math.random() - 0.5) * 0.7);
        this.sendToReverb(gain, 0.1);
        source.start();
        return true;
    }

    playThump(now, pan, volume) {
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(92 + Math.random() * 28, now);
        osc.frequency.linearRampToValueAtTime(32, now + 0.28);

        const click = ctx.createOscillator();
        click.type = 'triangle';
        click.frequency.setValueAtTime(180 + Math.random() * 40, now);
        click.frequency.linearRampToValueAtTime(50, now + 0.12);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.006);
        gain.gain.linearRampToValueAtTime(volume * 0.45, now + 0.05);
        gain.gain.linearRampToValueAtTime(0.0001, now + 0.42);

        osc.connect(gain);
        click.connect(gain);
        this.panTo(gain, pan * 0.4);
        this.sendToReverb(gain, 0.22);
        osc.start(now);
        click.start(now);
        osc.stop(now + 0.45);
        click.stop(now + 0.18);
    }

    playBurstBody(now, pan, type) {
        const ctx = this.ctx;
        const isWillow = type === 'willow';
        const dur = isWillow ? 1.6 : type === 'ring' ? 0.55 : 0.9;

        const src = this.noiseSource(this.pinkBuffer);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = isWillow ? 180 : 90;

        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(isWillow ? 2600 : 5200, now);
        lp.frequency.linearRampToValueAtTime(isWillow ? 700 : 420, now + dur);

        const gain = ctx.createGain();
        const peak = isWillow ? 0.38 : 0.62;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(peak, now + 0.008);
        gain.gain.linearRampToValueAtTime(peak * 0.35, now + 0.12);
        gain.gain.linearRampToValueAtTime(0.0001, now + dur);

        src.connect(hp);
        hp.connect(lp);
        lp.connect(gain);
        this.panTo(gain, pan);
        this.sendToReverb(gain, 0.35);
        src.start(now);
        src.stop(now + dur + 0.04);
    }

    playCrackles(now, pan, type) {
        const isWillow = type === 'willow';
        const count = isWillow ? 10 : type === 'ring' ? 14 : 22;
        const span = isWillow ? 1.35 : type === 'ring' ? 0.55 : 0.95;

        for (let i = 0; i < count; i++) {
            const t = now + Math.pow(Math.random(), 0.65) * span;
            this.playPop(t, pan + (Math.random() - 0.5) * 0.5, isWillow ? 0.08 : 0.14);
        }
    }

    playEchoSlap(now, pan) {
        const ctx = this.ctx;
        const delay = ctx.createDelay();
        delay.delayTime.value = 0.16 + Math.random() * 0.08;

        const src = this.noiseSource(this.whiteBuffer, false);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 900;
        filter.Q.value = 0.7;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now + 0.12);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.18);
        gain.gain.linearRampToValueAtTime(0.0001, now + 0.7);

        src.connect(filter);
        filter.connect(delay);
        delay.connect(gain);
        this.panTo(gain, -pan * 0.6);
        this.sendToReverb(gain, 0.4);
        src.start(now);
        src.stop(now + 0.25);
    }

    playFountain() {
        if (!this.canPlay()) return;

        const ctx = this.ctx;
        const now = ctx.currentTime;
        const dur = 1.5 + Math.random() * 0.4;

        const src = this.noiseSource(this.whiteBuffer);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 2400;

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.Q.value = 1.1;
        bp.frequency.value = 4200;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.06);
        gain.gain.setValueAtTime(0.18, now + dur * 0.75);
        gain.gain.linearRampToValueAtTime(0.0001, now + dur);

        src.connect(hp);
        hp.connect(bp);
        bp.connect(gain);
        this.panTo(gain, (Math.random() - 0.5) * 0.4);
        this.sendToReverb(gain, 0.08);
        src.start(now);
        src.stop(now + dur + 0.02);

        const sparks = 8 + Math.floor(Math.random() * 6);
        for (let i = 0; i < sparks; i++) {
            this.playPop(now + Math.random() * dur, (Math.random() - 0.5) * 0.6, 0.07);
        }
    }

    playPop(atTime, pan = 0, volume = 0.14) {
        if (!this.ctx || !this.master || !this.whiteBuffer) return;

        const ctx = this.ctx;
        const src = this.noiseSource(this.whiteBuffer, false);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1800 + Math.random() * 4200;
        filter.Q.value = 3 + Math.random() * 4;

        const gain = ctx.createGain();
        const peak = volume * (0.6 + Math.random() * 0.8);
        gain.gain.setValueAtTime(0.0001, atTime);
        gain.gain.linearRampToValueAtTime(peak, atTime + 0.004);
        gain.gain.linearRampToValueAtTime(0.0001, atTime + 0.035 + Math.random() * 0.04);

        src.connect(filter);
        filter.connect(gain);
        this.panTo(gain, pan);
        src.start(atTime);
        src.stop(atTime + 0.09);
    }

    canPlay() {
        if (!this.enabled || !this.ctx || !this.master || !this.pinkBuffer) return false;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
            return this.ctx.state === 'running';
        }
        return this.ctx.state === 'running';
    }

    destroy() {
        this.enabled = false;
        if (this.master) {
            try { this.master.disconnect(); } catch (_) { /* already disconnected */ }
            this.master = null;
        }
        if (this.reverb) {
            try { this.reverb.disconnect(); } catch (_) { /* already disconnected */ }
            this.reverb = null;
        }
        if (this.ctx && this.ctx.state !== 'closed') {
            this.ctx.close().catch(() => {});
        }
        this.whiteBuffer = null;
        this.pinkBuffer = null;
        this.impulseBuffer = null;
        this.ctx = null;
    }
}
