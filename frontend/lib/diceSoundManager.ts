// Dice sound effects and audio manager (TypeScript)
export class DiceSoundManager {
  private enabled: boolean;
  private volume: number;
  private sounds: Record<string, HTMLAudioElement> = {};
  private SOUND_URLS: Record<string, string> = {
    roll: "/sounds/dice_roll.mp3",
    hit: "/sounds/dice_hit.mp3",
    stop: "/sounds/dice_stop.mp3",
  };

  constructor(enabled = true, volume = 0.7) {
    this.enabled = enabled;
    this.volume = volume;
    this.preloadSounds();
  }

  preloadSounds() {
    for (const [name, url] of Object.entries(this.SOUND_URLS)) {
      const audio = new Audio(url);
      audio.volume = this.volume;
      this.sounds[name] = audio;
    }
  }

  play(soundName: string, delay = 0) {
    if (!this.enabled || !(soundName in this.sounds)) return;
    if (delay > 0) {
      setTimeout(() => this._playSound(soundName), delay * 1000);
    } else {
      this._playSound(soundName);
    }
  }

  private _playSound(soundName: string) {
    try {
      this.sounds[soundName].currentTime = 0;
      this.sounds[soundName].play();
    } catch (e) {
      // Silently fail if sound doesn't load
    }
  }
}
