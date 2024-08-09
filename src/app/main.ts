import * as PIXI from 'pixi.js';
import { Howl, Howler } from 'howler';

import { GameBoard, GameBoardMenu, OnResizeFlag } from "./parcheesi";
import { bgColor } from "./constants";

//const bgColor = Color.rgb('rgb(0,0,0)').rgbNumber()

export enum ResolutionChangeBehavior {
	KeepBuiltIn = 0,
	Deal = 1,
	Skip = 2,
}

export const KeepBuiltInResolutionValue = 3;
export const ResolutionChangeMode = ResolutionChangeBehavior.Deal;

let canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

let type = "WebGL";
if (!PIXI.utils.isWebGLSupported()) {
	type = "canvas";
}
PIXI.utils.sayHello(type);

//PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR
//PIXI.settings.PRECISION_FRAGMENT = PRECISION.HIGH
//PIXI.settings.FILTER_RESOLUTION = 2

// This will let images scale better
PIXI.settings.ANISOTROPIC_LEVEL = 16;
PIXI.settings.MIPMAP_TEXTURES = PIXI.MIPMAP_MODES.ON;

const renderer = new PIXI.Renderer({
	view: canvas,
	width: window.innerWidth,
	height: window.innerHeight,
	antialias: true,
	transparent: false,
	resolution: (window.devicePixelRatio || 1),
	backgroundColor: bgColor,
});

// TODO: What does it really do, should it be only used in some resolution change behaviors?
//renderer.autoDensity = true
// view is apparently an HTML Canvas element
// renderer.view.style.position = "absolute";
// renderer.view.style.display = "block";

if (ResolutionChangeMode as ResolutionChangeBehavior === ResolutionChangeBehavior.KeepBuiltIn) {
	renderer.resolution = KeepBuiltInResolutionValue;
	renderer.plugins.interaction.resolution = KeepBuiltInResolutionValue;
}

const stage = new PIXI.Container();

let loader = new PIXI.Loader(); // of PIXI.Loader.shared

export const IMAGE_ALIASES: Record<string, string> = {
	"dice": "/images/ParcheesiDice.png",
	"select": "/images/SelectPlayers.png",
	"start": "/images/Start.png",
	"skip": "/images/Skip.png",
	"again": "/images/PlayAgain.png",
	"cog": "/images/Cog.png",
	"settings-restart": "/images/Restart.png",
	"sound-off": "/images/sound-off.png",
	"sound-on": "/images/sound-on.png",
};
// Images are exported with PW2 dimensions (1,2,4,8,16,32,64,128,256,512,1024,2048),
// however in the editor we can read the real size of the portion,
// which we want to keep to render w:h properly.
// TODO: May be in the future we could keep this ratio in the file name
export const WH_IMAGE_RATIO: Record<string, number> = {
	'select': 184.3 / 87.8,
	'start': 141.7 / 37.1,
	'skip': 91.6 / 37,
	'again': 155.3 / 87.9,
	'cog': 1,
	'settings-restart': 195.6 / 37.1,
};

for (const im in IMAGE_ALIASES) {
	await PIXI.Assets.load(IMAGE_ALIASES[im]);
}

// ------------ sounds ----------------------------------------
export let sounds: Record<string, Howl> = {};
const GLOBAL_VOLUME = 0.5;
export let CURRENT_VOLUME = 0;

Howler.autoUnlock = false;
// Initially we always mute
Howler.volume(0);

export function unmuteIfVolumeUp() {
	Howler.volume(CURRENT_VOLUME);
}

export function toggleMuteUnmute() {
	CURRENT_VOLUME = CURRENT_VOLUME == 0 ? GLOBAL_VOLUME : 0;
	unmuteIfVolumeUp();
}

export function isMuted() {
	return CURRENT_VOLUME == 0;
}

export const DICE_SOUND_COUNT = 29;
for (let i = 0; i < DICE_SOUND_COUNT; i++) {
	loadSound(`dice-${i}`, [`/sounds/dice/dice-${i}.webm`, `/sounds/dice/dice-${i}.mp3`], 0.3);
}

export const PIECE_SOUND_COUNT = 8;
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

export function playSound(name: string, randomRate: boolean = false) {
	//sound.play('wrong', {loop: false, volume: WRONG_VOLUME})
	sounds[name].rate(randomRate ? 1 + (Math.random() * 0.3 - 0.15) : 1);
	sounds[name].play();
}


// called upon each error
loader.onError.add((errMessage: string, loader: any, resource: any) => {
	console.log("[Loader] " + errMessage + ": " + resource.url);
});
// called once per loaded/errored file
loader.onProgress.add((loader: any, resource: any) => {
	//console.log("[Loader] " + loader.progress + "%")
});
// called once per loaded file
loader.onLoad.add((loader: any, resource: any) => {
	//console.log(`[Loader] ${resource.name} [${resource.url}]`) // Using special "`" delimiter
}
);

//renderer.plugins.interaction.autoPreventDefault = false

loader.onComplete.add((loader: PIXI.Loader, resources: any) => {  // once all resources have loaded
	// White 16x16 texture
	// stage.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))

	//let ship = new ShipGraphics(renderer, stage);
	let ticker = new PIXI.Ticker();

	let accumulatedPlayersByColor = new Array<boolean>();
	for (let i = 0; i < 4; i++) {
		accumulatedPlayersByColor.push(false);
	}

	let gameFinishedRestartClick = (playersByColor: Array<boolean>) => {
		accumulatedPlayersByColor = playersByColor;
		menu.visible = true;
		if (game != null) {
			game.visible = false;
		}
	};

	let amountOfPlayers = function (a: Array<boolean>): number {
		let result = 0;
		for (let i = 0; i < a.length; i++) {
			if (a[i]) {
				result++;
			}
		}
		return result;
	};

	let menu = new GameBoardMenu(renderer, loader, accumulatedPlayersByColor,
		(playersByColor: Array<boolean>) => {
			//setPiecesPerColor(amountOfPlayers(playersByColor) <= 2 ? 5 : 4)
			accumulatedPlayersByColor = playersByColor;
			menu.visible = false;
			let prevGame = game;
			let newGame = new GameBoard(renderer, loader, accumulatedPlayersByColor, gameFinishedRestartClick, (playersByColor: Array<boolean>) => {
				gameFinishedRestartClick(playersByColor);
			});
			stage.addChild(newGame);
			if (prevGame != null) {
				stage.removeChild(prevGame);
				prevGame.destroy();
			}
			game = newGame;
		},
		(playersByColor: Array<boolean>) => {
			gameFinishedRestartClick(playersByColor);
		});
	menu.visible = true;

	let game: GameBoard;
	stage.addChild(menu);

	stage.sortChildren(); // For zIndex to take effect

	ticker.add((delta) => {
		if (menu != null && menu.visible) {
			menu.update(delta);
			renderer.render(menu);
		}
		if (game != null && game.visible) {
			game.update(delta);
			renderer.render(game);
		}
	}, PIXI.UPDATE_PRIORITY.LOW);
	ticker.start();

	let savedResolution: number;
	let savedWidth: number;
	let savedHeight: number;
	let savedOrientation: string;

	let onResize = (event: UIEvent | null) => {
		// let iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
		// let iw = (iOS) ? screen.width : window.innerWidth
		// let ih = (iOS) ? screen.height : window.innerHeight
		let newResolution = window.devicePixelRatio;
		let newWidth = document.body.clientWidth; // window.innerWidth
		let newHeight = document.body.clientHeight; //window.innerHeight
		let newOrientation = (screen.orientation || {}).type || (<any>screen).mozOrientation || (<any>screen).msOrientation;
		let changed = (newResolution != savedResolution)
			|| (newWidth != savedWidth)
			|| (newHeight != savedHeight)
			|| (newOrientation != savedOrientation);
		savedResolution = newResolution;
		savedWidth = newWidth;
		savedHeight = newHeight;
		savedOrientation = newOrientation;
		if (changed) {
			if (ResolutionChangeMode == ResolutionChangeBehavior.Deal) {
				renderer.resolution = window.devicePixelRatio;
				renderer.plugins.interaction.resolution = window.devicePixelRatio;
			} else if (ResolutionChangeMode == ResolutionChangeBehavior.KeepBuiltIn) {
				renderer.resolution = KeepBuiltInResolutionValue;
				renderer.plugins.interaction.resolution = KeepBuiltInResolutionValue;
			} else if (ResolutionChangeMode == ResolutionChangeBehavior.Skip) {
			}
			renderer.resize(newWidth, newHeight);
			// Renderer's size depends on renderer.resolution automatically
			if (menu != null) {
				menu.onResize(OnResizeFlag.ALL);
			}
			if (game != null) {
				game.onResize(OnResizeFlag.ALL);
			}
			window.scrollTo(0, 0);
		}
	};

	onResize(null);
	// window.addEventListener('resize', onResize, false)
	// window.addEventListener("orientationchange", onResize, false);
	window.setInterval(() => {
		onResize(null);

		if (Howler.ctx != null && Howler.ctx.state == "suspended") {
			if (Howler.volume() > 0) {
				Howler.ctx.resume().then(
					() => {
					}
				).catch(() => {
				});
			}
		}

	}, 1000);

	// This is supposed to give us access to coming to background and back event
	// document.onvisibilitychange = function() {
	// 	if (document.visibilityState === 'visible') {
	// 		sound.resumeAll()
	// 	} else {
	// 		sound.pauseAll()
	// 		sound.stopAll()
	// 	}
	// }

	// if (window.DeviceOrientationEvent) {
	// 	window.addEventListener("deviceorientation", onResize, false);
	// }

	//console.log(PIXI.utils.TextureCache)
	renderer.render(stage);

});

// loader.load() // TODO(next): Do we need to wait or the loader takes care of that?