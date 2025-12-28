import { rgb } from "./colorUtils";

export const regularCellColor = rgb('rgb(90,95,105)');
export const safeCellColor = rgb('rgb(115,120,130)');
export const playerColors: Array<number> = [
	rgb('rgb(230,95,50)'),   // Vibrant orange
	rgb('rgb(75,190,60)'),   // Bright green
	rgb('rgb(50,160,220)'),  // Bright blue
	rgb('rgb(165,80,200)'),  // Vibrant purple
];
export const diceUnusedColor = rgb('rgb(255,255,255)');
export const diceUsedColor = rgb('rgb(100,100,100)');
//const cogColor = rgb('rgb(150,150,150)');
//const cogColor = rgb('rgb(255,255,255)');
export const settingsButtonsColor = rgb('rgb(163,163,163)');
export const pieceSelectedBorderColor = rgb('rgb(255,255,255)');
export const pieceNonSelectedBorderColor = rgb('rgb(30,30,30)');
export const bgColor = rgb('rgb(50,0,0)');
export const backgroundBoxColor = rgb('rgb(18,28,42)');

export const diceImageCellSize = 256
export const diceImageCellsCount = 8

//====Game options=========================
export const ALLOW_SKIP_AFTER_FIRST_MOVE = true
export const BONUS_FOR_KNOCKING_OPPONENT = 20
export const BONUS_FOR_REACHING_GOAL = 10
export const BONUS_CAN_BE_SKIPPED = true // In case skip is allowed at all
export let PIECES_PER_COLOR = 4

export function setPiecesPerColor(a: number) {
	PIECES_PER_COLOR = a
}

