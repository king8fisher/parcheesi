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
  // ------------ sounds ----------------------------------------
  const sounds: Record<string, Howl> = {};
  const GLOBAL_VOLUME = 0.5;
  let CURRENT_VOLUME = 0; // Start with sound disabled
  let audioContextUnlocked = false;

  // Let Howler handle unlocking audio on first user interaction (required for mobile)
  Howler.autoUnlock = true;
  // Initially we always mute (will be unmuted when user enables sound)
  Howler.volume(0);

  function unmuteIfVolumeUp() {
    // On mobile, the AudioContext must be resumed during a user gesture
    if (!audioContextUnlocked && Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume().then(() => {
        audioContextUnlocked = true;
      }).catch(() => {});
    }
    audioContextUnlocked = true;
    Howler.volume(CURRENT_VOLUME);
  }

  function toggleMuteUnmute() {
    CURRENT_VOLUME = CURRENT_VOLUME == 0 ? GLOBAL_VOLUME : 0;
    unmuteIfVolumeUp();
  }

  function isMuted() {
    return CURRENT_VOLUME == 0;
  }

  // MP3 first for iOS Safari compatibility (doesn't support webm)
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

  function loadSound(name: string, url: string | string[], volume: number) {
    const s = new Howl({
      autoplay: false,
      src: url,
      preload: true,
      loop: false,
      volume: volume,
      html5: true, // Required for iOS Safari compatibility
      onplayerror: function () {
        if (Howler.volume() > 0) {
          if (Howler.ctx && Howler.ctx.state == "suspended") {
            Howler.ctx.resume().then(
              () => {
                s.play();
              }
            ).catch(() => {
            });
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
    //sound.play('wrong', {loop: false, volume: WRONG_VOLUME})
    sounds[name].rate(randomRate ? 1 + (Math.random() * 0.3 - 0.15) : 1);
    sounds[name].play();
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
