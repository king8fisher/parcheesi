import * as PIXI from 'pixi.js';

import { bgColor } from "./constants";
import { GameBoard, GameBoardMenu, OnResizeFlag } from "./parcheesi";
import { initSounds, Sounds } from "./sounds";

export enum ResolutionChangeBehavior {
	KeepBuiltIn = 0,
	Deal = 1,
	Skip = 2,
}

export const KeepBuiltInResolutionValue = 3;
export const ResolutionChangeMode = ResolutionChangeBehavior.Deal;


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

export const loadParcheesiGame = async (app: PIXI.Application) => {

	// TODO(next): We don't need the loader anymore?
	// let loader = new PIXI.Loader(); // of PIXI.Loader.shared

	for (const im in IMAGE_ALIASES) {
		await PIXI.Assets.load(IMAGE_ALIASES[im]);
	}

	const sounds = initSounds();
	const stage = new PIXI.Container();
	beginGame(app, stage, sounds);



};

// TODO(next): Improve rendering
// PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR
// PIXI.settings.PRECISION_FRAGMENT = PRECISION.HIGH
// PIXI.settings.FILTER_RESOLUTION = 2
// PIXI.settings.ANISOTROPIC_LEVEL = 16;
// PIXI.settings.MIPMAP_TEXTURES = PIXI.MIPMAP_MODES.ON;

// TODO(next):
// const renderer = new PIXI.Renderer({
// 	view: canvas,
// 	width: window.innerWidth,
// 	height: window.innerHeight,
// 	antialias: true,
// 	transparent: false,
// 	resolution: (window.devicePixelRatio || 1),
// 	backgroundColor: bgColor,
// });

// TODO: What does it really do, should it be only used in some resolution change behaviors?
//renderer.autoDensity = true
// view is apparently an HTML Canvas element
// renderer.view.style.position = "absolute";
// renderer.view.style.display = "block";

// TODO(next):
// if (ResolutionChangeMode as ResolutionChangeBehavior === ResolutionChangeBehavior.KeepBuiltIn) {
// 	renderer.resolution = KeepBuiltInResolutionValue;
// 	renderer.plugins.interaction.resolution = KeepBuiltInResolutionValue;
// }



// TODO(next): No need for listeners?
// // called upon each error
// loader.onError.add((errMessage: string, loader: any, resource: any) => {
// 	console.log("[Loader] " + errMessage + ": " + resource.url);
// });
// // called once per loaded/errored file
// loader.onProgress.add((loader: any, resource: any) => {
// 	//console.log("[Loader] " + loader.progress + "%")
// });
// // called once per loaded file
// loader.onLoad.add((loader: any, resource: any) => {
// 	//console.log(`[Loader] ${resource.name} [${resource.url}]`) // Using special "`" delimiter
// });

//renderer.plugins.interaction.autoPreventDefault = false

const beginGame = (app: PIXI.Application, stage: PIXI.Container, sounds: Sounds) => {
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

	let menu = new GameBoardMenu(app.renderer, /*loader, */accumulatedPlayersByColor,
		(playersByColor: Array<boolean>) => {
			//setPiecesPerColor(amountOfPlayers(playersByColor) <= 2 ? 5 : 4)
			accumulatedPlayersByColor = playersByColor;
			menu.visible = false;
			let prevGame = game;
			let newGame = new GameBoard(app.renderer, /*loader, */accumulatedPlayersByColor, gameFinishedRestartClick, (playersByColor: Array<boolean>) => {
				gameFinishedRestartClick(playersByColor);
			}, sounds);
			stage.addChild(newGame);
			if (prevGame != null) {
				stage.removeChild(prevGame);
				prevGame.destroy();
			}
			game = newGame;
		},
		(playersByColor: Array<boolean>) => {
			gameFinishedRestartClick(playersByColor);
		}, sounds);
	menu.visible = true;

	let game: GameBoard;
	stage.addChild(menu);

	stage.sortChildren(); // For zIndex to take effect

	ticker.add((ticker) => {
		if (menu != null && menu.visible) {
			menu.update(ticker.deltaTime);
			app.renderer.render(menu);
		}
		if (game != null && game.visible) {
			game.update(ticker.deltaTime);
			app.renderer.render(game);
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
				app.renderer.resolution = window.devicePixelRatio;
				// TODO(next): fix next line
				// app.renderer.plugins.interaction.resolution = window.devicePixelRatio;
			} else if (ResolutionChangeMode == ResolutionChangeBehavior.KeepBuiltIn) {
				app.renderer.resolution = KeepBuiltInResolutionValue;
				// TODO(next): fix next line
				// app.renderer.plugins.interaction.resolution = KeepBuiltInResolutionValue;
			} else if (ResolutionChangeMode == ResolutionChangeBehavior.Skip) {
			}
			app.renderer.resize(newWidth, newHeight);
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
	app.renderer.render(stage);
};