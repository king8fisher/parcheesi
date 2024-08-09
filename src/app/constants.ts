import * as Color from "color";

export const regularCellColor = Color.rgb('rgb(100,100,100)').rgbNumber();
export const safeCellColor = Color.rgb('rgb(125,125,125)').rgbNumber(); //0xD8A032;
export const playerColors: Array<number> = [
	Color.rgb('rgb(236,102,64)').rgbNumber(),
	Color.rgb('rgb(92,188,53)').rgbNumber(),
	Color.rgb('rgb(38,153,196)').rgbNumber(),
	Color.rgb('rgb(146,43,225)').rgbNumber(),
];
export const diceUnusedColor = Color.rgb('rgb(255,255,255)').rgbNumber()
export const diceUsedColor = Color.rgb('rgb(100,100,100)').rgbNumber()
//const cogColor = Color.rgb('rgb(150,150,150)').rgbNumber()
//const cogColor = Color.rgb('rgb(255,255,255)').rgbNumber()
export const settingsButtonsColor = Color.rgb('rgb(163,163,163)').rgbNumber()
export const pieceSelectedBorderColor = Color.rgb('rgb(255,255,255)').rgbNumber()
export const pieceNonSelectedBorderColor = Color.rgb('rgb(30,30,30)').rgbNumber()
export const bgColor = Color.rgb('rgb(50,0,0)').rgbNumber()
export const backgroundBoxColor = Color.rgb('rgb(21,35,57)').rgbNumber()

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

