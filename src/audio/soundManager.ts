/**
 * Web Audio API sound manager.
 * Each play() call spawns a new AudioBufferSourceNode so multiple
 * overlapping plays of the same sound blend naturally.
 *
 * iOS (and Chrome on iOS) require AudioContext to be created inside a
 * user-gesture handler. Call unlock() from the first tap/click before
 * any play() is expected; loads that arrive before unlock are queued and
 * decoded once the context exists.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private pending = new Map<string, ArrayBuffer>();

  unlock(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    for (const [id, raw] of this.pending) {
      void this.ctx.decodeAudioData(raw)
        .then(buf => this.buffers.set(id, buf))
        .catch(() => {});
    }
    this.pending.clear();
  }

  async load(id: string, url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const raw = await response.arrayBuffer();
      if (this.ctx) {
        const buf = await this.ctx.decodeAudioData(raw);
        this.buffers.set(id, buf);
      } else {
        this.pending.set(id, raw);
      }
    } catch {
      // Sound loading is non-critical — silently ignore errors
    }
  }

  play(id: string, volume = 1): void {
    const buffer = this.buffers.get(id);
    if (!buffer || !this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(this.ctx.destination);
      source.start();
    } catch {
      // Playback errors are non-critical
    }
  }
}

export const soundManager = new SoundManager();
