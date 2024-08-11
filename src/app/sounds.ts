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
  let sounds: Record<string, Howl> = {};
  const GLOBAL_VOLUME = 0.5;
  let CURRENT_VOLUME = 0;

  Howler.autoUnlock = false;
  // Initially we always mute
  Howler.volume(0);

  function unmuteIfVolumeUp() {
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
  for (let i = 0; i < DICE_SOUND_COUNT; i++) {
    loadSound(`dice-${i}`, [`/sounds/dice/dice-${i}.webm`, `/sounds/dice/dice-${i}.mp3`], 0.3);
  }

  const PIECE_SOUND_COUNT = 8;
  for (let i = 0; i < PIECE_SOUND_COUNT; i++) {
    loadSound(`piece-${i}`, [`/sounds/piece/piece-${i}.webm`, `/sounds/piece/piece-${i}.mp3`], 0.5);
  }
  loadSound('wrong', ['/sounds/wrong.webm', '/sounds/wrong.mp3'], 0.5);
  loadSound('tada', ['/sounds/tada.webm', '/sounds/tada.mp3'], 0.8);
  loadSound('bonus', ['/sounds/bonus.webm', '/sounds/bonus.mp3'], 0.5);
  loadSound('sweep', ['/sounds/sweep.webm', '/sounds/sweep.mp3'], 0.3);
  loadSound('click', ['/sounds/click.webm', '/sounds/click.mp3'], 0.3);
  loadSound('select', ['/sounds/select.webm', '/sounds/select.mp3'], 0.3);

  function loadSound(name: string, url: string | string[], volume: number) {
    //loader.add('tada', '/sounds/tada.mp3')
    let s = new Howl({
      autoplay: false,
      src: url,
      preload: true,
      loop: false,
      volume: volume,
      onplayerror: function () {
        if (Howler.volume() > 0) {
          if (Howler.ctx.state == "suspended") {
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
