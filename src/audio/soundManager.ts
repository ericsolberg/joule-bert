/**
 * Web Audio API sound manager.
 * Each play() call spawns a new AudioBufferSourceNode so multiple
 * overlapping plays of the same sound blend naturally.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  async load(id: string, url: string): Promise<void> {
    try {
      const ctx = this.getCtx();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.buffers.set(id, audioBuffer);
    } catch {
      // Sound loading is non-critical — silently ignore errors
    }
  }

  play(id: string, volume = 1): void {
    const buffer = this.buffers.get(id);
    if (!buffer) return;
    try {
      const ctx = this.getCtx();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch {
      // Playback errors are non-critical
    }
  }
}

export const soundManager = new SoundManager();
