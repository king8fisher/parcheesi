import { Howl, Howler } from 'howler';

export type Sounds = {
  DICE_SOUND_COUNT: number;
  PIECE_SOUND_COUNT: number;
  isMuted: () => boolean;
  playSound: (name: string, randomRate?: boolean) => void;
  toggleMuteUnmute: () => void;
  unmuteIfVolumeUp: () => void;
};

export const initSounds = (): Sounds => {
  const sounds: Record<string, Howl> = {};
  const GLOBAL_VOLUME = 0.5;
  let CURRENT_VOLUME = 0;
  let soundsLoaded = false;

  // Don't initialize AudioContext until user interaction
  Howler.autoUnlock = true;

  function loadAllSounds() {
    if (soundsLoaded) return;
    soundsLoaded = true;

    // MP3 first for iOS Safari compatibility
    const DICE_SOUND_COUNT = 29;
    for (let i = 0; i < DICE_SOUND_COUNT; i++) {
      loadSound(`dice-${i}`, [`/sounds/dice/dice-${i}.mp3`, `/sounds/dice/dice-${i}.webm`], 0.3);
    }

    const PIECE_SOUND_COUNT = 8;
    for (let i = 0; i < PIECE_SOUND_COUNT; i++) {
      loadSound(`piece-${i}`, [`/sounds/piece/piece-${i}.mp3`, `/sounds/piece/piece-${i}.webm`], 0.5);
    }
    loadSound('wrong', ['/sounds/wrong.mp3', '/sounds/wrong.webm'], 0.5);
    loadSound('tada', ['/sounds/tada.mp3', '/sounds/tada.webm'], 0.8);
    loadSound('bonus', ['/sounds/bonus.mp3', '/sounds/bonus.webm'], 0.5);
    loadSound('sweep', ['/sounds/sweep.mp3', '/sounds/sweep.webm'], 0.3);
    loadSound('click', ['/sounds/click.mp3', '/sounds/click.webm'], 0.3);
    loadSound('select', ['/sounds/select.mp3', '/sounds/select.webm'], 0.3);
  }

  function unlockAndLoad() {
    // Resume AudioContext if suspended (required for mobile)
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume().catch(() => {});
    }
    loadAllSounds();
  }

  function unmuteIfVolumeUp() {
    unlockAndLoad();
    Howler.volume(CURRENT_VOLUME);
  }

  function toggleMuteUnmute() {
    CURRENT_VOLUME = CURRENT_VOLUME == 0 ? GLOBAL_VOLUME : 0;
    unmuteIfVolumeUp();
  }

  function isMuted() {
    return CURRENT_VOLUME == 0;
  }

  const DICE_SOUND_COUNT = 29;
  const PIECE_SOUND_COUNT = 8;

  function loadSound(name: string, url: string | string[], volume: number) {
    const s = new Howl({
      autoplay: false,
      src: url,
      preload: true,
      loop: false,
      volume: volume,
      html5: false, // Use Web Audio API for better pooling
      onplayerror: function () {
        if (Howler.volume() > 0) {
          if (Howler.ctx && Howler.ctx.state == "suspended") {
            Howler.ctx.resume().then(() => s.play()).catch(() => {});
          }
          s.once('unlock', function () {
            s.play();
          });
        }
      },
    });
    sounds[name] = s;
  }

  function playSound(name: string, randomRate: boolean = false) {
    if (!soundsLoaded) return; // Sounds not ready yet
    const sound = sounds[name];
    if (!sound) return;
    sound.rate(randomRate ? 1 + (Math.random() * 0.3 - 0.15) : 1);
    sound.play();
  }

  return {
    DICE_SOUND_COUNT,
    PIECE_SOUND_COUNT,
    isMuted,
    playSound,
    toggleMuteUnmute,
    unmuteIfVolumeUp,
  };
};
