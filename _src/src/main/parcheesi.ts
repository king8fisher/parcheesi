import * as PIXI from 'pixi.js'
import * as Color from "color/index";

import {
	WH_IMAGE_RATIO,
	DICE_SOUND_COUNT,
	PIECE_SOUND_COUNT,

	ResolutionChangeMode,
	ResolutionChangeBehavior,

	playSound,
	unmuteIfVolumeUp,
	isMuted,
	toggleMuteUnmute
} from "./main";
import {tweenFunctions} from "./util";
import {
	ALLOW_SKIP_AFTER_FIRST_MOVE,
	backgroundBoxColor, bgColor, BONUS_CAN_BE_SKIPPED,
	BONUS_FOR_KNOCKING_OPPONENT,
	BONUS_FOR_REACHING_GOAL, diceImageCellsCount,
	diceImageCellSize, diceUnusedColor, diceUsedColor,
	pieceNonSelectedBorderColor, PIECES_PER_COLOR,
	pieceSelectedBorderColor,
	playerColors,
	regularCellColor,
	safeCellColor, settingsButtonsColor
} from "./constants";

export enum OnResizeFlag {
	SIZE = 0x01,
	DRAW = 0x02,
	ALL = SIZE | DRAW
}

interface OnResize {
	onResize: (flag: OnResizeFlag) => void
}

export const TIMEOUT_BETWEEN_MOVES = 800

// All these will be recalculated
export class D {
	static CELL_WIDTH = 70
	static CELL_HEIGHT = 30
	static CELL_GAP = 2
	static CELL_RADIUS = 3

	static recalculateCellSizes(renderer: PIXI.Renderer) {
		// height to width ratio
		let ratio = 30 / 75
		let amountOfWidths = (3 + ratio * 14) + 2 // (+ extra spacing)
		//======================

		let size = this.getViewportSize(renderer)
		let box = size.x
		if (size.y < size.x) {
			box = size.y
		}
		D.CELL_WIDTH = box / amountOfWidths
		D.CELL_HEIGHT = D.CELL_WIDTH * ratio
		D.CELL_GAP = D.CELL_HEIGHT / 15
		D.CELL_RADIUS = D.CELL_HEIGHT / 10
	}

	// Return the true size taking into account resolution of the screen
	public static getViewportSize(renderer: PIXI.Renderer): PIXI.Point {
		if (ResolutionChangeMode == ResolutionChangeBehavior.Deal) {
			return new PIXI.Point(renderer.width / renderer.resolution,
				renderer.height / renderer.resolution)
		} else {
			return new PIXI.Point(renderer.screen.width,
				renderer.screen.height)
		}

	}

}

//=========================================

enum CellShapeType {
	NO_CORNER,
	CORNER_LEFT,
	CORNER_RIGHT,
}

enum CellFunctionType {
	ORDINARY_CELL,
	SAFE_CELL,
}

// CellGraphics draws the cells of the board of
// all kinds, taking into account "playerColor",
// safe cells as well as corners where blocks
// meet each other
export class CellGraphics extends PIXI.Graphics implements OnResize {
	cellShapeType: CellShapeType
	cellFunctionType: CellFunctionType
	cellBlockIndex: number
	playerColor: number
	greyOut: boolean = true

	// cellIndexInTheBlock internally is counted
	// [0, 1, 2,
	//  3, 4, 5, ...
	// which makes #0 the corner left, and #2 - corner right cell.
	// The cells with indexes #9, #11, #22 are designated as Cheese
	constructor(cellIndexInTheBlock: number, playerColor: number) {
		super()
		this.cellBlockIndex = cellIndexInTheBlock
		this.playerColor = playerColor
		this.cellShapeType = CellShapeType.NO_CORNER

		if (cellIndexInTheBlock == 0) {
			this.cellShapeType = CellShapeType.CORNER_LEFT
		} else if (cellIndexInTheBlock == 2) {
			this.cellShapeType = CellShapeType.CORNER_RIGHT
		}
		this.cellFunctionType = CellFunctionType.ORDINARY_CELL
		let found = [9, 11, 22].indexOf(cellIndexInTheBlock)
		if (found >= 0) {
			this.cellFunctionType = CellFunctionType.SAFE_CELL
		}
		this.onResize(OnResizeFlag.ALL)
	}

	// onResize() resizes itself, children and includes draw()
	public onResize(flag: OnResizeFlag) {
		this.clear()
		this.lineStyle(0)
		let color = Color.rgb(PIXI.utils.hex2string(this.playerColor))
		if (this.greyOut) {
			color = Color.rgb(PIXI.utils.hex2string(regularCellColor))
		} else {
			color = color.mix(Color.rgb(PIXI.utils.hex2string(regularCellColor)), (this.cellBlockIndex / 3) / 7)
		}
		if (this.cellFunctionType == CellFunctionType.SAFE_CELL) {
			if (this.cellBlockIndex == 11 && !this.greyOut) {
				// Special home cell
				this.beginFill(color.rgbNumber(), 1)
			} else {
				this.beginFill(safeCellColor, 1)
			}
		} else {
			if (this.cellBlockIndex % 3 == 1) {
				this.beginFill(color.rgbNumber(), 1)
			} else {
				this.beginFill(regularCellColor, 1)
			}
		}
		if (this.cellShapeType == CellShapeType.CORNER_LEFT || this.cellShapeType == CellShapeType.CORNER_RIGHT) {
			this.moveTo(D.CELL_GAP / 1.5 + D.CELL_GAP / 2 + D.CELL_HEIGHT - D.CELL_GAP, D.CELL_GAP / 2)
				.lineTo(D.CELL_WIDTH - D.CELL_GAP - D.CELL_RADIUS / 2, D.CELL_GAP / 2)
				.arc(D.CELL_WIDTH - D.CELL_GAP / 2 - D.CELL_RADIUS, D.CELL_GAP / 2 + D.CELL_RADIUS, D.CELL_RADIUS, -Math.PI / 2, 0)
				.lineTo(D.CELL_WIDTH - D.CELL_GAP / 2, D.CELL_HEIGHT - D.CELL_GAP / 2 - D.CELL_RADIUS)
				.arc(D.CELL_WIDTH - D.CELL_GAP / 2 - D.CELL_RADIUS, D.CELL_HEIGHT - D.CELL_GAP / 2 - D.CELL_RADIUS, D.CELL_RADIUS, 0, Math.PI / 2)
				.lineTo(D.CELL_GAP / 1.5 + D.CELL_GAP / 2, D.CELL_HEIGHT - D.CELL_GAP / 2)
				.closePath()
			if (this.cellShapeType == CellShapeType.CORNER_RIGHT) {
				this.pivot.x = D.CELL_WIDTH
				this.scale.set(-1, 1)
			}
		} else {
			this.drawRoundedRect(D.CELL_GAP / 2, D.CELL_GAP / 2, D.CELL_WIDTH - D.CELL_GAP, D.CELL_HEIGHT - D.CELL_GAP, D.CELL_RADIUS)
		}
		this.endFill()
		if (this.cellFunctionType == CellFunctionType.SAFE_CELL) {
			this.beginHole()
			this.drawStar(D.CELL_WIDTH / 2, D.CELL_HEIGHT / 2, 9, D.CELL_HEIGHT / 3, D.CELL_HEIGHT / 8)
			this.endHole()
		}
	}

	setGreyOut(greyOut: boolean) {
		this.greyOut = greyOut
	}
}

// ButtonBehaviorContainer: If you implement "hoverChanged()",
// call it from your constructor, the base class can't do that for you.
export abstract class ButtonBehaviorContainer extends PIXI.Container {
	constructor() {
		super()
		this.interactive = true
		this.buttonMode = true
		this.on('tap', this.onTap.bind(this))
			// .on('click', this.onTap.bind(this))
			.on('pointerdown', this.onButtonDown.bind(this))
			.on('pointerup', this.onButtonUp.bind(this))
			.on('pointerupoutside', this.onButtonUp.bind(this))
			.on('pointerover', this.onButtonOver.bind(this))
			.on('pointerout', this.onButtonOut.bind(this))
	}

	abstract isAllowedToClick(): boolean

	abstract clickHappened(): void

	abstract hoverChanged(): void

	private static mouseDownOn: PIXI.Container = null
	private hovered: boolean

	public isHovered() {
		return this.hovered
	}

	public isDown() {
		return ButtonBehaviorContainer.mouseDownOn == this
	}

	onTap() {
		unmuteIfVolumeUp()

		if (this.isAllowedToClick()) {
			this.clickHappened()
		}
		// this.onButtonDown()
		// this.isOverMe = true
		// this.onButtonUp()
		// this.isOverMe = false
	}

	onButtonDown() {
		unmuteIfVolumeUp()
		if (this.isAllowedToClick()) {
			ButtonBehaviorContainer.mouseDownOn = this;
		}
	}

	onButtonUp() {
		if (ButtonBehaviorContainer.mouseDownOn == this && this.hovered && this.isAllowedToClick()) {
			this.clickHappened()
		}
		ButtonBehaviorContainer.mouseDownOn = null;
	}

	onButtonOver() {
		this.hovered = true;
		this.hoverChanged()
		if (ButtonBehaviorContainer.mouseDownOn == null) {
			return;
		}
	}

	onButtonOut() {
		this.hovered = false;
		this.hoverChanged()
		if (ButtonBehaviorContainer.mouseDownOn == null) {
			return;
		}
	}

	// Make sure to call this to remove any potentially
	// leftovers of clicks. It actually statically removes any
	static CancelAll() {
		ButtonBehaviorContainer.mouseDownOn = null
	}

}

class PieceButtonBehavior extends ButtonBehaviorContainer {
	owner: Piece

	constructor(owner: Piece) {
		super();
		this.owner = owner
		this.hoverChanged()
	}

	clickHappened(): void {
		if (this.owner.board.pieceSelected == this.owner) {
			// Deselect if selected the same as before
			this.owner.board.pieceSelected = null
		} else {
			this.owner.board.pieceSelected = this.owner
		}
		playSound("select", true)
	}

	isAllowedToClick(): boolean {
		return this.owner.board.isThisColorMove(this.owner.colorIndex)
			&& this.owner.pathIndex < GameBoard.pathCellsByBlocksIndexes.length;
	}

	hoverChanged(): void {
		this.owner.alpha = (this.isHovered() && this.isAllowedToClick()) ? 1 : 0.8
	}
}

export class Piece extends PIXI.Container implements OnResize {
	board: GameBoard
	overlay: PIXI.Graphics
	colorIndex: number
	// pathIndex is counted from the standpoint of each color, being
	// -1 for home, 0 for the beginning of this player's path
	pathIndex: number

	internalColorGroupIndex: number

	button: PieceButtonBehavior

	// internalGroupIndex represents each color's piece index, [0..4)
	constructor(board: GameBoard, colorIndex: number, internalColorGroupIndex: number) {
		super();
		this.board = board
		this.colorIndex = colorIndex
		this.internalColorGroupIndex = internalColorGroupIndex

		this.pathIndex = -1 // Every piece begins its life at home
		this.prevPathIndex = -1

		this.overlay = new PIXI.Graphics()
		this.addChild(this.overlay)

		this.button = new PieceButtonBehavior(this)
		this.addChild(this.button)

		this.onResize(OnResizeFlag.ALL)
	}

	// onResize() resizes itself, children and includes draw()
	onResize(flag: OnResizeFlag) {
		if (flag & OnResizeFlag.SIZE) {
			// Just a slight surrounding for a bigger area of clicking
			this.button.hitArea = new PIXI.Circle(0, 0, D.CELL_HEIGHT / 2)
		}
	}

	// setPathIndex(pathIndex: number) {
	// 	if (this.board.isOurColorMove(this.colorIndex)){
	// 		if (this.board.movePieceIfAllowed(this, pathIndex)) {
	// 		}
	// 	}
	// }

	prevPathIndex: number
	prevPositionX: number
	prevPositionY: number
	tweenTimeStart: number = -1
	tweenTimeEnd: number = -1


	// TODO: Move out stuff that doesn't need to always update
	update(delta: number) {
		if (!this.board.isPlayerPlaying(this.colorIndex)) {
			this.visible = false
			return
		}
		if (this.pathIndex != this.prevPathIndex) {
			// Position on the path has changed. We will initiate tween.
			this.prevPositionX = this.position.x
			this.prevPositionY = this.position.y
			this.tweenTimeStart = this.board.timePassed
			this.tweenTimeEnd = this.tweenTimeStart + 400
			this.prevPathIndex = this.pathIndex
		}

		let desiredDestinationPosition = this.position
		if (this.pathIndex < 0) {
			// Home
			desiredDestinationPosition = GameBoard.homeGlobalPositions[this.colorIndex][this.internalColorGroupIndex]
		} else if (this.pathIndex == GameBoard.pathCellsByBlocksIndexes.length) {
			// Goal
			desiredDestinationPosition = GameBoard.goalGlobalPositions[this.colorIndex][this.internalColorGroupIndex]
		} else if (this.pathIndex > GameBoard.pathCellsByBlocksIndexes.length) {
			// Don't draw it
			this.overlay.clear()
			return
		} else {
			let index = GameBoard.getGlobalCellIndex(this.colorIndex, (this.pathIndex) % GameBoard.pathCellsByBlocksIndexes.length)
			desiredDestinationPosition = GameBoard.cellsByBlocksGlobalPositions[index]
		}

		if (this.tweenTimeStart < 0 || this.board.timePassed >= this.tweenTimeEnd) {
			this.position.copyFrom(desiredDestinationPosition)
		} else {
			let x = tweenFunctions.easeOutExpo(this.board.timePassed - this.tweenTimeStart, this.prevPositionX, desiredDestinationPosition.x, this.tweenTimeEnd - this.tweenTimeStart)
			let y = tweenFunctions.easeOutExpo(this.board.timePassed - this.tweenTimeStart, this.prevPositionY, desiredDestinationPosition.y, this.tweenTimeEnd - this.tweenTimeStart)
			this.position.x = x
			this.position.y = y
		}

		this.overlay.clear()

		if (this.button.isDown() && this.button.isHovered()) {
			this.overlay.beginFill((Color.rgb(PIXI.utils.hex2string(playerColors[this.colorIndex])
			)).lighten(0.2).rgbNumber())
		} else {
			this.overlay.beginFill(playerColors[this.colorIndex])
			if (this == this.board.pieceSelected) {
				this.overlay.lineStyle(D.CELL_HEIGHT * 0.15 / 2, pieceSelectedBorderColor, 1, 1)
			} else {
				this.overlay.lineStyle(D.CELL_HEIGHT * 0.15 / 2, pieceNonSelectedBorderColor, 1, 0.5)
			}
		}
		this.overlay.drawCircle(0, 0, D.CELL_HEIGHT * 0.35)
		this.overlay.endFill()
		this.visible = true
	}

}

class DiceButtonBehavior extends ButtonBehaviorContainer {
	owner: Dice

	constructor(owner: Dice) {
		super();
		this.owner = owner
		this.hoverChanged()
	}

	clickHappened(): void {
		if (this.owner.board.useDiceAtSelectedPieceIfAllowed(this.owner).success) {
		}
	}

	isAllowedToClick(): boolean {
		return (!this.owner.used)
	}

	hoverChanged(): void {
		this.owner.alpha = (this.isHovered() && this.isAllowedToClick()) ? 1 : 0.8
	}
}


export class Dice extends PIXI.Container implements OnResize {
	board: GameBoard
	overlay: PIXI.Graphics
	sprite: PIXI.Sprite
	internalDiceIndex: number

	button: DiceButtonBehavior

	private rolledNumber: number
	bonusNumber: number

	// To simplify calculation of how far this dice can go
	currentDiceNumber(): number {
		if (this.bonusNumber > 0) {
			return this.bonusNumber
		}
		return this.rolledNumber
	}

	originallyRolledNumber(): number {
		return this.rolledNumber
	}

	used: boolean

	// internalGroupIndex represents each color's piece index, [0..4)
	constructor(board: GameBoard, internalDiceIndex: number) {
		super();
		this.board = board
		this.internalDiceIndex = internalDiceIndex

		this.overlay = new PIXI.Graphics()

		this.addChild(this.overlay)

		this.sprite = new PIXI.Sprite(board.loader.resources["dice"].texture.clone() /*to frame them separately*/); // .texture accesses the pixel data
		this.sprite.texture.frame = new PIXI.Rectangle(0, 0, diceImageCellSize, diceImageCellSize);
		// TO prevent bleeding of pixelated textures, use PIXI.SCALE_MODES.NEAREST:
		this.sprite.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR; //  floating-point values for scaling
		// Rotate around the center
		this.sprite.anchor.x = 0.5;
		this.sprite.anchor.y = 0.5;
		this.sprite.visible = false

		this.addChild(this.sprite)

		this.button = new DiceButtonBehavior(this)
		this.addChild(this.button)

		this.onResize(OnResizeFlag.ALL)

		this.rollTheDice()
	}

	rollTheDice() {
		this.rolledNumber = Math.floor(Math.random() * 6) + 1
		this.bonusNumber = 0
		this.used = false
		if (this.internalDiceIndex == 0) {
			playSound(`dice-${Math.floor(Math.random() * DICE_SOUND_COUNT)}`)
		}
	}

	// onResize() resizes itself, children and includes draw()
	public onResize(flag: OnResizeFlag): void {
		if (flag & OnResizeFlag.SIZE) {
			this.button.hitArea = new PIXI.Rectangle(-D.CELL_HEIGHT, -D.CELL_HEIGHT, D.CELL_HEIGHT * 2, D.CELL_HEIGHT * 2)
		}
	}

	// TODO: Move out stuff that doesn't need to always update
	update(delta: number) {
		let colorIndex = this.board.whoGoesColorIndex
		let globalPosition = GameBoard.dicesGlobalPositions[colorIndex][this.internalDiceIndex]
		this.position.set(globalPosition.x, globalPosition.y)
		this.overlay.clear()
		if (this.button.isDown() && this.button.isHovered()) {
			this.overlay.lineStyle(D.CELL_GAP, playerColors[colorIndex], 0.8)
			this.overlay.beginFill(playerColors[colorIndex])
			this.overlay.drawRoundedRect(-D.CELL_HEIGHT, -D.CELL_HEIGHT, D.CELL_HEIGHT * 2, D.CELL_HEIGHT * 2, D.CELL_HEIGHT / 1.8)
			this.overlay.endFill()
		}
		let currentDiceNumber = this.currentDiceNumber()
		let frameIndex = (currentDiceNumber - 1)
		if (currentDiceNumber == BONUS_FOR_REACHING_GOAL) {
			frameIndex = 6
		} else if (currentDiceNumber == BONUS_FOR_KNOCKING_OPPONENT) {
			frameIndex = 7
		}
		this.sprite.texture.frame = new PIXI.Rectangle((frameIndex * diceImageCellSize) % (diceImageCellSize * diceImageCellsCount), 0, diceImageCellSize, diceImageCellSize);

		this.sprite.width = D.CELL_HEIGHT * 2
		this.sprite.height = D.CELL_HEIGHT * 2
		this.sprite.tint = (this.used ? diceUsedColor : diceUnusedColor)
		this.sprite.visible = this.board.wonColorIndex < 0

		// Rotate dice toward the player
		this.sprite.rotation = -colorIndex * Math.PI / 2
	}

}

class SkipButtonBehavior extends ButtonBehaviorContainer {
	owner: Skip

	constructor(owner: Skip) {
		super();
		this.owner = owner
		this.hoverChanged()
	}

	clickHappened(): void {
		if (this.owner.board.useSkipIfAllowed()) {
			playSound("sweep", true)
		}
	}

	isAllowedToClick(): boolean {
		return this.owner.board.isSkipPossible()
	}

	hoverChanged(): void {
		this.owner.alpha = (this.isHovered() && this.isAllowedToClick()) ? 1 : 0.8
	}
}


export class Skip extends PIXI.Container implements OnResize {
	board: GameBoard
	overlay: PIXI.Graphics

	button: SkipButtonBehavior

	// Skip is designed as only one button per board
	constructor(board: GameBoard) {
		super();
		this.board = board

		this.overlay = new PIXI.Graphics()

		this.addChild(this.overlay)

		this.button = new SkipButtonBehavior(this)
		this.button.hitArea = new PIXI.Rectangle(-D.CELL_WIDTH / 2, -D.CELL_HEIGHT / 2, D.CELL_WIDTH, D.CELL_HEIGHT)
		this.addChild(this.button)

		let text = new PIXI.Sprite(this.board.loader.resources["skip"].texture)
		text.anchor.set(0.5, 0.5)
		this.button.addChild(text);

		this.onResize(OnResizeFlag.ALL)
	}

	onResize(flag: OnResizeFlag): void {
		let width = D.CELL_WIDTH * 0.8
		let text = <PIXI.Sprite>this.button.getChildAt(0)
		let imageName = "skip"
		let ratio = WH_IMAGE_RATIO[imageName]
		text.texture = this.board.loader.resources[imageName].texture
		text.width = width * 0.7
		text.height = text.width / ratio
	}

	// TODO: Move out stuff that doesn't need to always update
	update(delta: number) {
		let colorIndex = this.board.whoGoesColorIndex
		let globalPosition = GameBoard.skipGlobalPositions[colorIndex]
		this.position.set(globalPosition.x, globalPosition.y)

		// Rotate the whole button toward the player
		this.rotation = colorIndex * (-Math.PI / 2)
		if (this.board.isSkipPossible()) {
			this.overlay.clear()
			if (this.button.isDown() && this.button.isHovered()) {
				this.overlay.lineStyle(D.CELL_GAP, playerColors[colorIndex], 0.8)
			}
			this.overlay.beginFill(playerColors[colorIndex])
			this.overlay.drawRoundedRect(-D.CELL_WIDTH / 2, -D.CELL_HEIGHT / 2, D.CELL_WIDTH, D.CELL_HEIGHT, D.CELL_HEIGHT / 4)
			this.overlay.endFill()
			this.visible = true
		} else {
			this.visible = false
		}
	}

}

export class Background extends PIXI.Graphics implements OnResize {
	readonly renderer: PIXI.Renderer

	constructor(renderer: PIXI.Renderer) {
		super();
		this.renderer = renderer
		this.onResize(OnResizeFlag.ALL)
	}

	// onResize() resizes itself, children and includes draw()
	public onResize(flag: OnResizeFlag): void {
		let bgGap = D.CELL_HEIGHT / 4
		this.clear()
		this.beginFill(backgroundBoxColor, 1)
		let size = D.getViewportSize(this.renderer)
		this.drawRoundedRect(bgGap, bgGap,
			size.x - bgGap * 2,
			size.y - bgGap * 2, bgGap * 2)
		this.endFill()
	}
}

export class BlockContainer extends PIXI.Container implements OnResize {
	board: GameBoardBase
	colorIndex: number

	constructor(board: GameBoardBase, colorIndex: number) {
		super();
		this.board = board
		this.colorIndex = colorIndex

		let color = playerColors[this.colorIndex]
		for (let i = 0; i < 24; i++) {
			let cell = new CellGraphics(i, color);
			this.addChild(cell)
			//cell.position.set((i % 3) * Dimensions.CELL_WIDTH, (Math.floor(i / 3)) * Dimensions.CELL_HEIGHT);
		}

		this.onResize(OnResizeFlag.ALL)
	}

	// onResize() resizes itself, children and includes draw()
	public onResize(flag: OnResizeFlag): void {
		let greyOut = true
		if (this.board instanceof GameBoard) {
			let board = <GameBoard>this.board
			greyOut = !board.isPlayerPlaying(this.colorIndex)
		}
		for (let i = 0; i < 24; i++) {
			let cell = <CellGraphics>this.getChildAt(i)
			// Reposition and re-draw
			cell.position.set((i % 3) * D.CELL_WIDTH, (Math.floor(i / 3)) * D.CELL_HEIGHT);
			cell.setGreyOut(greyOut)
			cell.onResize(flag)
		}

		this.pivot.set(D.CELL_WIDTH * 3 / 2, -D.CELL_WIDTH * 3 / 2 + D.CELL_HEIGHT)
		let viewportSize = D.getViewportSize(this.board.renderer);
		this.position.set(viewportSize.x / 2, viewportSize.y / 2)
		this.rotation = (-Math.PI / 2) * this.colorIndex
	}
}

export class Highlighter extends PIXI.Graphics implements OnResize {
	board: GameBoard
	colorIndex: number

	constructor(board: GameBoard, colorIndex: number) {
		super();
		this.board = board
		this.colorIndex = colorIndex
		this.onResize(OnResizeFlag.ALL)
	}

	// onResize() resizes itself, children and includes draw()
	onResize(flag: OnResizeFlag): void {
		this.clear()

		this.beginFill(playerColors[this.colorIndex])
		this.drawRoundedRect(D.CELL_GAP / 2, D.CELL_GAP / 2, 3 * D.CELL_WIDTH - D.CELL_GAP, D.CELL_HEIGHT / 2 - D.CELL_GAP, D.CELL_RADIUS)
		this.endFill()
		this.position.set(0, 8 * D.CELL_HEIGHT)
		this.alpha = 0 //Initially hidden
	}

	// TODO: Move out stuff that doesn't need to always update
	update(delta: number) {
		if (this.board.wonColorIndex >= 0) {
			this.alpha = (this.board.wonColorIndex == this.colorIndex ? 0.75 + Math.sin(this.board.timePassed * 0.01) * 0.25 : 0)
		} else {
			this.alpha = (this.board.whoGoesColorIndex == this.colorIndex ? 1 : 0)
		}
	}
}


interface MoveResult {
	success: boolean
	bonus: number // 0 if no bonus, corresponding bonus otherwise
}

export class GameBoardBase extends PIXI.Graphics implements OnResize {
	restartGameCallback: (arg0: Array<boolean>) => void

	public renderer: PIXI.Renderer
	public loader: PIXI.Loader

	blocks: Array<BlockContainer> = new Array<BlockContainer>()

	constructor(renderer: PIXI.Renderer, loader: PIXI.Loader, restartGameCallback: (arg0: Array<boolean>) => void) {
		super();
		this.renderer = renderer
		this.loader = loader
		this.restartGameCallback = restartGameCallback
		D.recalculateCellSizes(this.renderer)

		this.bg = new Background(this.renderer)
		this.addChild(this.bg)

		this.blocks.length = 0
		for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
			let blockContainer = new BlockContainer(this, colorIndex)
			this.addChild(blockContainer);
			// Saving into array
			this.blocks.push(blockContainer)
		}
	}

	private readonly bg: Background

	public timePassed = 0.0;

	// TODO: Move out stuff that doesn't need to always update
	public update(delta: number) {
		//this.timePassed += delta
		this.timePassed = performance.now()
	}

	// onResize() resizes itself, children and includes draw()
	onResize(flag: OnResizeFlag): void {
		// Clear any button clicks
		ButtonBehaviorContainer.CancelAll()
		D.recalculateCellSizes(this.renderer)
		this.bg.onResize(flag)
		for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
			this.blocks[colorIndex].onResize(flag)
		}
	}

	public filter(f: PIXI.Filter[]) {
		for (let i = 0; i < this.blocks.length; i++) {
			this.blocks[i].filters = f
		}
	}

}

export class GameBoard extends GameBoardBase implements OnResize {

	// Global array of positions covering the whole board in one-dimensional array,
	// block after block as they are getting drawn initially. Certainly has to be
	// recalculated upon every resize
	//
	//          +-----------------------+
	//          |26,29,32,35,38,41,44,47|
	//          |25,28,..............,46|
	//          |24,27,30,33,36,39,42,45|
	// +--------+-----------------------+
	// | 0, 1, 2|
	// | 3, 4, 5|
	// | 6, 7, 8|
	// | 9,10,11|
	// |12,13,14|
	// |15,16,17|
	// |18,19,20|
	// |21,22,23|
	// +--------+
	//
	static cellsByBlocksGlobalPositions: Array<PIXI.Point> = new Array<PIXI.Point>()
	// A list of cellsByBlocksGlobalPositions' indexes representing a whole
	// path of a piece from the first cell when it's out till the very last cell
	// before it leaves the board
	// (71) [11, 8, 5, 2, 24, 27, 30, 33, 36, 39, 42, 45, 46, 47, 44, 41, 38, 35, 32, 29, 26, 48, 51, 54, 57, 60, 63, 66, 69, 70, 71, 68, 65, 62, 59, 56, 53, 50, 72, 75, 78, 81, 84, 87, 90, 93, 94, 95, 92, 89, 86, 83, 80, 77, 74, 0, 3, 6, 9, 12, 15, 18, 21, 22, 19, 16, 13, 10, 7, 4, 1]
	static pathCellsByBlocksIndexes: Array<number> = new Array<number>()
	// Home & Goal positions one array per color
	// [0: [Point,Point,Point,Point],
	//  1: [Point,Point,Point,Point],
	//  ...]
	static homeGlobalPositions: Array<Array<PIXI.Point>> = new Array<Array<PIXI.Point>>()
	static goalGlobalPositions: Array<Array<PIXI.Point>> = new Array<Array<PIXI.Point>>()

	// Dices position. Array with 2 locations per each color
	// [0: [Point, Point],
	// [1: [Point, Point],
	// ...]
	static dicesGlobalPositions: Array<Array<PIXI.Point>> = new Array<Array<PIXI.Point>>()
	// Skip global positions. One point per color
	static skipGlobalPositions: Array<PIXI.Point> = new Array<PIXI.Point>()

	// All the pieces in groups, array of PIECES_PER_COLOR elements per each color
	// [0: [Piece,Piece,Piece,Piece],
	//  1: [Piece,Piece,Piece,Piece],
	//  ...]
	pieces: Array<Array<Piece>> = new Array<Array<Piece>>()

	// Four blocks array
	//blocks: Array<BlockContainer> = new Array<BlockContainer>()

	// Four highlighters to mark turns, one per color
	highlighters: Array<Highlighter> = new Array<Highlighter>()
	// 2 dices
	dices: Array<Dice> = new Array<Dice>()

	skip: Skip

	cog: Cog

	pieceSelected: Piece = null

	startGameButton: ButtonBehaviorContainer

	// This will flip to actual number inside "adjustWhoGoes()"
	whoGoesColorIndex: number = -1
	wonColorIndex: number = -1

	private playersByColor: Array<boolean>

	public isPlayerPlaying(colorIndex: number): boolean {
		if (this.playersByColor === undefined) return false
		return this.playersByColor[colorIndex]
	}

	// With the pathIndex being local to each color group we want to calculate
	// global cell index within the cellsByBlocksGlobalPositions
	static getGlobalCellIndex(colorIndex: number, pathIndex: number): number {
		if (pathIndex < 0) {
			return -1
		}
		return (GameBoard.pathCellsByBlocksIndexes[pathIndex] + 24 * colorIndex) % GameBoard.cellsByBlocksGlobalPositions.length
	}

	private static preparePiecePath() {
		// This will initiate the list of indices of the #0 player the way a piece walks along
		// possible cells
		GameBoard.pathCellsByBlocksIndexes.length = 0 // Erase array
		GameBoard.pathCellsByBlocksIndexes.push(11, 8, 5, 2)
		for (let repeat = 0; repeat < 3; repeat++) {
			let skip = (repeat + 1) * 24
			for (let i = 0; i < 8; i++) {
				GameBoard.pathCellsByBlocksIndexes.push(skip + i * 3)
			}
			GameBoard.pathCellsByBlocksIndexes.push(skip + 22)
			for (let i = 7; i >= 0; i--) {
				GameBoard.pathCellsByBlocksIndexes.push(skip + i * 3 + 2)
			}
		}
		for (let i = 0; i < 8; i++) {
			GameBoard.pathCellsByBlocksIndexes.push(i * 3)
		}
		for (let i = 7; i >= 0; i--) {
			GameBoard.pathCellsByBlocksIndexes.push(i * 3 + 1)
		}
	}

	// Static init ensures one time initialization
	static init = (() => {
		GameBoard.preparePiecePath()
	})()

	beginGameCallback: (arg0: Array<boolean>) => void

	constructor(renderer: PIXI.Renderer, loader: PIXI.Loader, playersByColor: Array<boolean>,
	            beginGameCallback: (playersByColor: Array<boolean>) => void,
	            restartGameCallback: (playersByColor: Array<boolean>) => void) {
		super(renderer, loader, restartGameCallback);
		this.beginGameCallback = beginGameCallback

		this.playersByColor = playersByColor

		//this.blocks.length = 0
		this.highlighters.length = 0
		this.dices.length = 0

		for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
			//let blockContainer = new BlockContainer(this, colorIndex)
			//this.addChild(blockContainer);
			// Saving into array
			//this.blocks.push(blockContainer)
			let blockContainer = this.blocks[colorIndex]

			let highlighter = new Highlighter(this, colorIndex)
			blockContainer.addChild(highlighter)
			// Saving into array
			this.highlighters.push(highlighter)
		}
		this.calculateGlobalPositions();

		// Initializing all the pieces of all color groups
		this.pieces.length = 0
		for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
			this.pieces.push(new Array<Piece>())
			for (let i = 0; i < PIECES_PER_COLOR; i++) {
				let g = new Piece(this, colorIndex, i)

				// For debugging the game ending
				// g.pathIndex = 65 + i

				this.addChild(g)
				this.pieces[colorIndex].push(g)
			}
		}

		for (let diceIndex = 0; diceIndex < 2; diceIndex++) {
			let dice = new Dice(this, diceIndex)
			this.addChild(dice)
			this.dices.push(dice)
		}

		this.skip = new Skip(this)
		this.addChild(this.skip)


		this.startGameButton = new class extends ButtonBehaviorContainer {
			board: GameBoard

			constructor(board: GameBoard) {
				super();
				this.board = board
				this.hoverChanged()
			}

			clickHappened(): void {
				// Game begins: We call the function passed to us
				this.board.beginGameCallback(this.board.playersByColor)
				playSound("click", true)
			}

			isAllowedToClick(): boolean {
				return this.board.wonColorIndex >= 0
			}

			hoverChanged(): void {
				this.alpha = (this.isHovered() && this.isAllowedToClick()) ? 1 : 0.8
			}
		}(this)
		this.startGameButton.visible = false

		let graphics = new PIXI.Graphics()
		this.startGameButton.addChild(graphics)
		this.addChild(this.startGameButton)

		let text = new PIXI.Sprite(loader.resources["again"].texture)
		text.anchor.set(0.5, 0.5)
		this.startGameButton.addChild(text);
		this.addChild(this.startGameButton)

		this.cog = new Cog(this)
		this.addChild(this.cog);

		this.onResize(OnResizeFlag.ALL)

		this.adjustWhoGoes()
	}


	// Calculated positions don't leave any
	// children behind. As they add fake primitives, they
	// immediately get removed after calculation is done
	private calculateGlobalPositions() {
		GameBoard.cellsByBlocksGlobalPositions.length = 0
		for (let colorIndex = 0; colorIndex < this.blocks.length; colorIndex++) {
			let blockContainer = this.blocks[colorIndex]
			// Calculate every position of every cell
			for (let p = 0; p < 24; p++) {
				let fake = new PIXI.Graphics()
				fake.beginFill(0x0, 1)
				fake.drawCircle(0, 0, D.CELL_HEIGHT * 0.4)
				fake.endFill()
				fake.position.set((p % 3) * D.CELL_WIDTH + D.CELL_WIDTH / 2, (Math.floor(p / 3)) * D.CELL_HEIGHT + D.CELL_HEIGHT / 2);
				blockContainer.addChild(fake)
				GameBoard.cellsByBlocksGlobalPositions.push(fake.getGlobalPosition())
				blockContainer.removeChild(fake)
			}
		}


		// Homes locations
		GameBoard.homeGlobalPositions.length = 0
		for (let colorIndex = 0; colorIndex < this.blocks.length; colorIndex++) {
			let blockContainer = this.blocks[colorIndex]
			// For every color initiate homes
			GameBoard.homeGlobalPositions.push(new Array<PIXI.Point>())
			for (let piecePerColorIndex = 0; piecePerColorIndex < PIECES_PER_COLOR; piecePerColorIndex++) {
				let homeGraphicsCell = new PIXI.Graphics()
				homeGraphicsCell.beginFill(playerColors[colorIndex], 0)
				homeGraphicsCell.lineStyle(D.CELL_HEIGHT * 0.1, playerColors[colorIndex], 0.1)
				homeGraphicsCell.drawCircle(0, 0, D.CELL_HEIGHT * 0.4)
				homeGraphicsCell.endFill()
				homeGraphicsCell.position.set(D.CELL_WIDTH * 3 + D.CELL_HEIGHT / 2 + piecePerColorIndex * D.CELL_HEIGHT, D.CELL_HEIGHT * 3.5);
				blockContainer.addChild(homeGraphicsCell)
				GameBoard.homeGlobalPositions[colorIndex].push(homeGraphicsCell.getGlobalPosition())
				blockContainer.removeChild(homeGraphicsCell)
			}
		}

		// Goals locations
		GameBoard.goalGlobalPositions.length = 0
		for (let colorIndex = 0; colorIndex < this.blocks.length; colorIndex++) {
			let blockContainer = this.blocks[colorIndex]
			GameBoard.goalGlobalPositions.push(new Array<PIXI.Point>())
			// For every color initiate goals
			for (let piecePerColorIndex = 0; piecePerColorIndex < PIECES_PER_COLOR; piecePerColorIndex++) {
				let goalGraphicsCell = new PIXI.Graphics()
				goalGraphicsCell.beginFill(playerColors[colorIndex], 0)
				goalGraphicsCell.lineStyle(D.CELL_HEIGHT * 0.1, playerColors[colorIndex], 0.1)
				goalGraphicsCell.drawCircle(0, 0, D.CELL_HEIGHT * 0.4)
				goalGraphicsCell.endFill()
				let xDiff = 0
				let yDiff = 0
				if (piecePerColorIndex == 0) {
					xDiff = -D.CELL_HEIGHT
				} else if (piecePerColorIndex == 2) {
					xDiff = D.CELL_HEIGHT
				} else if (piecePerColorIndex == 3) {
					yDiff = -D.CELL_HEIGHT
				}
				goalGraphicsCell.position.set(D.CELL_WIDTH * 1.5 + xDiff, -D.CELL_HEIGHT / 2 + yDiff);
				blockContainer.addChild(goalGraphicsCell)
				GameBoard.goalGlobalPositions[colorIndex].push(goalGraphicsCell.getGlobalPosition())
				blockContainer.removeChild(goalGraphicsCell)
			}
		}

		// Dice locations. Two per each color
		GameBoard.dicesGlobalPositions.length = 0
		for (let colorIndex = 0; colorIndex < this.blocks.length; colorIndex++) {
			let blockContainer = this.blocks[colorIndex]
			GameBoard.dicesGlobalPositions.push(new Array<PIXI.Point>())
			for (let diceIndex = 0; diceIndex < 2; diceIndex++) {
				// (Here we determine locations per each block)
				let diceGraphicsCell = new PIXI.Graphics()
				diceGraphicsCell.beginFill(playerColors[colorIndex], 1)
				diceGraphicsCell.drawRoundedRect(0, 0, D.CELL_HEIGHT * 2, D.CELL_HEIGHT * 2, 8)
				diceGraphicsCell.endFill()
				diceGraphicsCell.pivot.set(D.CELL_HEIGHT, D.CELL_HEIGHT)
				diceGraphicsCell.position.set(D.CELL_WIDTH * 3 + D.CELL_HEIGHT + (D.CELL_HEIGHT * 2.5 * diceIndex) + D.CELL_HEIGHT, D.CELL_HEIGHT * 5 + D.CELL_HEIGHT)
				blockContainer.addChild(diceGraphicsCell)
				GameBoard.dicesGlobalPositions[colorIndex].push(diceGraphicsCell.getGlobalPosition())
				blockContainer.removeChild(diceGraphicsCell)
			}
		}

		// Skip location
		GameBoard.skipGlobalPositions.length = 0
		for (let colorIndex = 0; colorIndex < this.blocks.length; colorIndex++) {
			let blockContainer = this.blocks[colorIndex]
			let skipGraphicsCell = new PIXI.Graphics()
			skipGraphicsCell.beginFill(playerColors[colorIndex], 0.2)
			skipGraphicsCell.drawRoundedRect(0, 0, D.CELL_HEIGHT * 4 + D.CELL_HEIGHT / 2, D.CELL_HEIGHT, 8)
			skipGraphicsCell.endFill()
			skipGraphicsCell.pivot.set((D.CELL_HEIGHT * 4 + D.CELL_HEIGHT / 2) / 2, D.CELL_HEIGHT / 2)
			skipGraphicsCell.position.set(D.CELL_WIDTH * 4 + D.CELL_HEIGHT, D.CELL_HEIGHT * 8.5)
			blockContainer.addChild(skipGraphicsCell)
			GameBoard.skipGlobalPositions.push(skipGraphicsCell.getGlobalPosition())
			blockContainer.removeChild(skipGraphicsCell)
		}
	}

	public isThisColorMove(colorIndex: number): boolean {
		return colorIndex == this.whoGoesColorIndex
	}

	// ========================== PUBLICLY ACCESSED ===========
	public isSkipPossible(): boolean {
		if (!ALLOW_SKIP_AFTER_FIRST_MOVE) return false
		if (this.wonColorIndex >= 0) return false
		if (this.dices[0].used && !this.dices[1].used) return true
		if (!this.dices[0].used && this.dices[1].used) return true
		// If bonus achieved of any kind
		if (BONUS_CAN_BE_SKIPPED) {
			if (this.dices[0].bonusNumber > 0 || this.dices[1].bonusNumber > 0) return true
		}
		return false
	}

	public useSkipIfAllowed(): boolean {
		if (!this.isSkipPossible()) return false
		// Simply mark both dice as used
		this.dices[0].used = true
		this.dices[1].used = true
		this.scheduleAdjustWhoGoes()
		return true
	}

	public useDiceAtSelectedPieceIfAllowed(dice: Dice): MoveResult {
		let moveResult = this._useDiceAtSelectedPieceIfAllowed(this.pieceSelected, dice, true)
		if (moveResult.success) {
			if (moveResult.bonus > 0) {
				playSound('bonus')
			} else {
				playSound(`piece-${Math.floor(Math.random() * PIECE_SOUND_COUNT)}`)
			}
		} else {
			playSound('wrong')
		}

		this.deselectPieceIfNecessary()
		this.scheduleAdjustWhoGoes()
		return moveResult
	}

	// ========================================================

	private deselectPieceIfNecessary() {
		// The only logic for now is:
		// Deselect piece if reached the goal
		if (this.pieceSelected != null && this.pieceSelected.pathIndex == GameBoard.pathCellsByBlocksIndexes.length) {
			this.pieceSelected = null
		}
	}

	private _useDiceAtSelectedPieceIfAllowed(piece: Piece, dice: Dice, performTheMove: boolean): MoveResult {
		if (piece == null) {
			return {success: false, bonus: 0}
		}
		if (piece.colorIndex != this.whoGoesColorIndex) {
			return {success: false, bonus: 0}
		}

		let movedResult: MoveResult = {success: false, bonus: 0}

		// When at home, attempt to use "5" to go out
		if (piece.pathIndex == -1) {
			if (dice.currentDiceNumber() == 5) {
				movedResult = this._movePieceIfAllowed(piece, 0, performTheMove)
				if (performTheMove) {

					if (movedResult.success) {
						dice.used = true
						if (movedResult.bonus > 0) {
							// Revert the dice used if bonus
							dice.bonusNumber = movedResult.bonus
							dice.used = false
						}
					}
				}
			} else {
				// Special case if a sum of still available dice is 5
				let sum = 0
				if (!this.dices[0].used) {
					sum += this.dices[0].currentDiceNumber()
				}
				if (!this.dices[1].used) {
					sum += this.dices[1].currentDiceNumber()
				}
				if (sum == 5) {
					movedResult = this._movePieceIfAllowed(piece, 0, performTheMove)
					if (performTheMove) {

						if (movedResult.success) {
							this.dices[0].used = true
							this.dices[1].used = true
							if (movedResult.bonus > 0) {
								// Revert the dice used if bonus. It's fine to revert the one that was clicked only
								dice.bonusNumber = movedResult.bonus
								dice.used = false
							}
						}
					}
				}
			}
		} else {
			movedResult = this._movePieceIfAllowed(piece, piece.pathIndex + dice.currentDiceNumber(), performTheMove)
			if (performTheMove) {
				if (movedResult.success) {
					dice.used = true
					if (movedResult.bonus > 0) {
						// Revert the dice used if bonus
						dice.bonusNumber = movedResult.bonus
						dice.used = false
					}
				}
			}
		}
		return movedResult
	}

	private schedulerForAdjustWhoGoes: number = 0

	private scheduleAdjustWhoGoes() {
		if (this.schedulerForAdjustWhoGoes > 0) {
			clearTimeout(this.schedulerForAdjustWhoGoes)
		}
		this.schedulerForAdjustWhoGoes = window.setTimeout(() => {
			this.adjustWhoGoes()
		}, TIMEOUT_BETWEEN_MOVES)
	}

	private getAmountOfPlayers(): number {
		let amount = 0
		for (let e of this.playersByColor) {
			if (e) {
				amount++
			}
		}
		return amount
	}

	private adjustWhoGoes() {
		if (this.whoGoesColorIndex == -1) {
			// Initializing with a random user if at least 2 players exist
			if (this.getAmountOfPlayers() >= 2) {
				while (this.whoGoesColorIndex == -1 || !this.playersByColor[this.whoGoesColorIndex]) {
					this.whoGoesColorIndex = Math.floor(Math.random() * 4)
				}
				this.pieceSelected = null
				this.dices[0].rollTheDice()
				this.dices[1].rollTheDice()
			}
			this.scheduleAdjustWhoGoes()
			return;
		} else {
			// Checking Win Condition. This does not depend whether all dice were used or not
			if (this.wonColorIndex >= 0) {
				return
			}

			for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
				if (this.playersByColor[colorIndex]) {
					let allReachedGoal = true
					for (let pieceIndex = 0; pieceIndex < PIECES_PER_COLOR; pieceIndex++) {
						if (this.pieces[colorIndex][pieceIndex].pathIndex != GameBoard.pathCellsByBlocksIndexes.length) {
							allReachedGoal = false
							break
						}
					}
					if (allReachedGoal) {
						// Mark all dice as used and don't proceed
						this.dices[0].used = true
						this.dices[1].used = true
						this.wonColorIndex = colorIndex

						// After game buttons
						// TODO: Move this GUI stuff out of here
						this.startGameButton.visible = true
						playSound('tada')
						// this.cog.setMenuVisible(true)
						return
					}
				}
			}

			if (this.dices[0].used && this.dices[1].used) {
				// If both are used, we only need to check if a doubled was rolled
			} else {
				// Walk through all still available dices in attempt to find available move
				for (let diceIndex = 0; diceIndex < 2; diceIndex++) {
					if (!this.dices[diceIndex].used) {
						// Calculate if impossible to use the dice
						for (let pieceIndex = 0; pieceIndex < PIECES_PER_COLOR; pieceIndex++) {
							if (this._useDiceAtSelectedPieceIfAllowed(this.pieces[this.whoGoesColorIndex][pieceIndex], this.dices[diceIndex], false).success) {
								// There's still a possible move, we don't adjust who goes
								return
							}
						}
					}
				}
			}
			// Nothing was found. But still, if a doubled was rolled, we are supposed to give a chance
			// to roll again
			if (this.dices[0].originallyRolledNumber() == this.dices[1].originallyRolledNumber()) {
				// Giving another chance to the same user
				this.pieceSelected = null
				this.dices[0].rollTheDice()
				this.dices[1].rollTheDice()
				this.scheduleAdjustWhoGoes()
				return
			}

			do {
				this.whoGoesColorIndex++
				this.whoGoesColorIndex = this.whoGoesColorIndex % 4
			} while (!this.playersByColor[this.whoGoesColorIndex])


			this.pieceSelected = null
			this.dices[0].rollTheDice()
			this.dices[1].rollTheDice()
			this.scheduleAdjustWhoGoes()
		}
	}

	// Only the board knows if this move is valid for this color and requested newPathIndex.
	// We can't move back home. And we can't move beyond the cell index right after available
	// path. movePieceIfAllowed will return true if the move actually happened.
	private _movePieceIfAllowed(pieceToMove: Piece, newPathIndex: number, performTheMove: boolean): MoveResult {
		if (newPathIndex < 0) {
			return {success: true, bonus: 0}
		} else if (newPathIndex == GameBoard.pathCellsByBlocksIndexes.length) {
			// We can always go to "goal" location if not beyond it!
			if (performTheMove) {
				pieceToMove.pathIndex = newPathIndex
			}
			return {success: true, bonus: BONUS_FOR_REACHING_GOAL}
		} else if (newPathIndex > GameBoard.pathCellsByBlocksIndexes.length) {
			// No way to jump beyond our goal location
			return {success: false, bonus: 0}
		}
		// Out of home has to walk through the first cell always
		if (pieceToMove.pathIndex == -1 && newPathIndex != 0) {
			return {success: false, bonus: 0}
		}
		let occupiedBy = this.getPieceOnPath(pieceToMove.colorIndex, newPathIndex)
		if (occupiedBy == null) {
			if (performTheMove) {
				pieceToMove.pathIndex = newPathIndex
			}
			return {success: true, bonus: 0}
		} else {
			// The cell is occupied. Shall we let the piece jump.
			if (occupiedBy.colorIndex == pieceToMove.colorIndex) {
				// Can't move to your own color
				return {success: false, bonus: 0}
			} else {
				// We can move to another color if someone is there in 2 cases:
				// 1. It's our path#0 cell
				if (newPathIndex == 0) {
					if (performTheMove) {
						occupiedBy.pathIndex = -1
						pieceToMove.pathIndex = newPathIndex
					}
					return {success: true, bonus: BONUS_FOR_KNOCKING_OPPONENT}
				} else {
					// If this is a "safe" cell
					if ([7, 12, 17, 24, 29, 34, 41, 46, 51, 58, 63].indexOf(newPathIndex) >= 0) {
						return {success: false, bonus: 0}
					} else {
						if (performTheMove) {
							occupiedBy.pathIndex = -1
							pieceToMove.pathIndex = newPathIndex
						}
						return {success: true, bonus: BONUS_FOR_KNOCKING_OPPONENT}
					}
				}
			}
		}
		//return {success: false, bonus: 0}
	}

	// Get piece on the local color's path. Returns null if not
	// occupied
	private getPieceOnPath(colorIndex: number, pathIndex: number): Piece {
		let globalCellIndex = GameBoard.getGlobalCellIndex(colorIndex, pathIndex)
		if (globalCellIndex < 0) {
			return null;
		}
		for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
			for (let i = 0; i < PIECES_PER_COLOR; i++) {
				let pieceGlobalCellIndex = GameBoard.getGlobalCellIndex(colorIndex, this.pieces[colorIndex][i].pathIndex)
				if (pieceGlobalCellIndex == globalCellIndex) {
					return this.pieces[colorIndex][i]
				}
			}
		}
		return null;
	}

	//============PUBLIC=================================================================
	// TODO: Move out stuff that doesn't need to always update
	public update(delta: number) {
		super.update(delta)
		for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
			for (let i = 0; i < PIECES_PER_COLOR; i++) {
				this.pieces[colorIndex][i].update(delta)
			}
			this.highlighters[colorIndex].update(delta)
		}
		for (let diceIndex = 0; diceIndex < 2; diceIndex++) {
			this.dices[diceIndex].update(delta)
		}

		this.skip.update(delta)
	}

	// onResize() resizes itself, children and includes draw()
	public onResize(flag: OnResizeFlag): void {
		super.onResize(flag)
		this.calculateGlobalPositions();
		for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
			for (let pieceIndex = 0; pieceIndex < this.pieces[colorIndex].length; pieceIndex++) {
				this.pieces[colorIndex][pieceIndex].onResize(flag)
			}
			this.highlighters[colorIndex].onResize(flag)
		}
		for (let diceIndex = 0; diceIndex < 2; diceIndex++) {
			this.dices[diceIndex].onResize(flag)
		}
		this.skip.onResize(flag)

		let viewportSize = D.getViewportSize(this.renderer)

		let graphics = <PIXI.Graphics>this.startGameButton.getChildAt(0)
		graphics.clear()
		let color = Color.rgb(PIXI.utils.hex2string(regularCellColor))
		graphics.beginFill(color.rgbNumber(), 0.5)
		let width = D.CELL_WIDTH * 3 - D.CELL_HEIGHT * 2 - D.CELL_GAP * 4
		graphics.drawRoundedRect(-width / 2, -width / 2, width, width, D.CELL_HEIGHT)
		graphics.endFill()

		this.startGameButton.position.set(viewportSize.x / 2, viewportSize.y / 2)

		let text = <PIXI.Sprite>this.startGameButton.getChildAt(1)
		let imageName = "again"
		let ratio = WH_IMAGE_RATIO[imageName]
		text.texture = this.loader.resources[imageName].texture
		text.width = width * 0.7
		text.height = text.width / ratio

		this.cog.onResize(flag)
	}

	public filter(f: PIXI.Filter[]) {
		super.filter(f)
		this.startGameButton.filters = f
		for (let i = 0; i < this.dices.length; i++) {
			this.dices[i].filters = f
		}
		this.skip.filters = f
		for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
			for (let i = 0; i < this.pieces[colorIndex].length; i++) {
				this.pieces[colorIndex][i].filters = f
			}
		}
	}

}

export class GameBoardMenu extends GameBoardBase implements OnResize {
	beginGameCallback: (playersByColor: Array<boolean>) => void

	playersByColor: Array<boolean>

	playerSelectionButtons: Array<ButtonBehaviorContainer> = new Array<ButtonBehaviorContainer>()

	startGameButton: ButtonBehaviorContainer
	startGameButtonGraphics: PIXI.Graphics
	startGameButtonText: PIXI.Sprite
	cog: Cog

	constructor(renderer: PIXI.Renderer, loader: PIXI.Loader, playersByColor: Array<boolean>, beginGameCallback: (arg0: Array<boolean>) => void,
	            restartGameCallback: (playersByColor: Array<boolean>) => void) {
		super(renderer, loader, restartGameCallback);

		this.playersByColor = playersByColor

		this.beginGameCallback = beginGameCallback

		// Four buttons for selecting local players
		for (let i = 0; i < 4; i++) {
			this.playersByColor.push(false)

			let button = new class extends ButtonBehaviorContainer {
				board: GameBoardMenu

				constructor(board: GameBoardMenu) {
					super();
					this.board = board
					this.hoverChanged()
				}

				clickHappened(): void {
					this.board.playersByColor[i] = !this.board.playersByColor[i]
					playSound("click", true)
					this.board.onResize(OnResizeFlag.DRAW)
				}

				isAllowedToClick(): boolean {
					return true;
				}

				hoverChanged(): void {
					this.alpha = this.isHovered() ? 1 : 0.8
				}

			}(this)
			this.playerSelectionButtons.push(button)
			let graphics = new PIXI.Graphics()
			button.addChild(graphics)
			this.addChild(button)
		}

		this.startGameButton = new class extends ButtonBehaviorContainer {
			board: GameBoardMenu

			constructor(board: GameBoardMenu) {
				super();
				this.board = board
				this.hoverChanged()
			}

			clickHappened(): void {
				this.board.onResize(OnResizeFlag.DRAW)
				playSound("click", true)
				// Game begins: We call the function passed to us
				this.board.beginGameCallback(this.board.playersByColor)
			}

			isAllowedToClick(): boolean {
				return this.board.isReadyToStart()
			}

			hoverChanged(): void {
				this.alpha = (this.isHovered() && this.isAllowedToClick()) ? 1 : 0.8
			}
		}(this)

		this.startGameButtonGraphics = new PIXI.Graphics()
		this.startGameButton.addChild(this.startGameButtonGraphics)

		this.startGameButtonText = new PIXI.Sprite() // No initial texture, it will be changed in onResize
		this.startGameButtonText.anchor.set(0.5, 0.5)
		this.startGameButton.addChild(this.startGameButtonText);

		this.addChild(this.startGameButton)

		this.cog = new Cog(this)
		this.addChild(this.cog);

		this.onResize(OnResizeFlag.ALL)

	}

	public isReadyToStart(): boolean {
		let count = 0
		for (let i = 0; i < this.playersByColor.length; i++) {
			if (this.playersByColor[i]) {
				count++
			}
		}
		return (count >= 2)
	}

	// onResize() resizes itself, children and includes draw()
	public onResize(flag: OnResizeFlag): void {
		super.onResize(flag);

		let viewportSize = D.getViewportSize(this.renderer)

		if (flag & OnResizeFlag.SIZE) {
			for (let i = 0; i < this.playerSelectionButtons.length; i++) {
				let matrix = new PIXI.Matrix()
				matrix.tx = viewportSize.x / 2
				matrix.ty = viewportSize.y / 2
				let diffM = new PIXI.Matrix()
				diffM.tx = -D.CELL_WIDTH * 1.5
				diffM.ty = D.CELL_WIDTH * 1.5
				diffM.rotate(-i * Math.PI / 2)
				matrix.append(diffM)
				this.playerSelectionButtons[i].position.set(matrix.tx, matrix.ty)
				this.playerSelectionButtons[i].rotation = -(i * Math.PI / 2)
			}
			this.startGameButton.position.set(viewportSize.x / 2, viewportSize.y / 2)
		}

		for (let i = 0; i < this.playerSelectionButtons.length; i++) {
			let graphics = <PIXI.Graphics>this.playerSelectionButtons[i].getChildAt(0)
			graphics.clear()

			let color = Color.rgb(PIXI.utils.hex2string(playerColors[i]))

			let alpha = 0.25
			if (this.playersByColor[i]) {
				//graphics.lineStyle(D.CELL_RADIUS, 0xFFFFFF, 1)
				alpha = 0.8
			}
			graphics.beginFill(color.rgbNumber(), alpha)
			let width = D.CELL_WIDTH * 3
			let height = D.CELL_HEIGHT * 7
			graphics.blendMode = PIXI.BLEND_MODES.EXCLUSION
			graphics.pivot.set(0, 0)
			graphics.position.set(0, 0)
			let overlappingBorder = D.CELL_HEIGHT / 2
			graphics.drawRoundedRect(0 - overlappingBorder, 0 - overlappingBorder, width + overlappingBorder * 2, height + overlappingBorder * 2, overlappingBorder)

			graphics.endFill()
		}

		this.startGameButtonGraphics.clear()
		let color = Color.rgb(PIXI.utils.hex2string(regularCellColor))
		this.startGameButtonGraphics.beginFill(color.rgbNumber(), 1)
		let width = D.CELL_WIDTH * 3 - D.CELL_HEIGHT * 2 - D.CELL_GAP * 4
		this.startGameButtonGraphics.drawRoundedRect(-width / 2, -width / 2, width, width, D.CELL_HEIGHT)
		this.startGameButtonGraphics.endFill()

		// let imageName = "cog"
		// let ratio = WH_IMAGE_RATIO[imageName]
		//
		// this.cog.width = width / 3
		// this.cog.height = this.cog.width / ratio
		//
		// this.cog.position.set(viewportSize.x - this.cog.width / 2 - D.CELL_HEIGHT / 2, this.cog.height / 2 + D.CELL_HEIGHT / 2)
		// // GOTCHA: Parent's scale makes child scale smaller correspondingly
		// this.cog.getChildAt(0).hitArea = new PIXI.Ellipse(0,0,(width / 5) / this.cog.scale.x, (width / 5) / this.cog.scale.y)

		let imageName = this.isReadyToStart() ? "start" : "select"
		let ratio = WH_IMAGE_RATIO[imageName]
		this.startGameButtonText.texture = this.loader.resources[imageName].texture

		this.startGameButtonText.width = width * 0.8
		this.startGameButtonText.height = this.startGameButtonText.width / ratio

		this.cog.onResize(flag)
	}

	// TODO: Move out stuff that doesn't need to always update
	update(delta: number) {
		super.update(delta);
	}

	public filter(f: PIXI.Filter[]) {
		super.filter(f)
		this.startGameButton.filters = f
	}

}

export class Cog extends PIXI.Container implements OnResize {

	cogSprite: PIXI.Sprite
	muteSprite: PIXI.Sprite

	renderer: PIXI.Renderer
	loader: PIXI.Loader
	gameBoardBase: GameBoardBase

	menu: Menu

	constructor(gameBoardBase: GameBoardBase) {
		super()
		this.renderer = gameBoardBase.renderer
		this.loader = gameBoardBase.loader
		this.gameBoardBase = gameBoardBase

		this.cogSprite = new PIXI.Sprite(this.loader.resources["cog"].texture)
		this.cogSprite.anchor.set(0.5, 0.5)
		this.cogSprite.blendMode = PIXI.BLEND_MODES.ADD_NPM
		//this.cogSprite.tint = cogColor
		this.addChild(this.cogSprite)

		this.cogSprite.addChild(new class extends ButtonBehaviorContainer {
			owner: Cog

			constructor(owner: Cog) {
				super();
				this.owner = owner
				this.hoverChanged()
			}

			clickHappened(): void {
				this.owner.toggleMenuVisibility()
				playSound("click", true)
			}

			isAllowedToClick(): boolean {
				return true;
			}

			hoverChanged(): void {
				this.owner.cogSprite.alpha = this.isHovered() ? 1 : 0.8
			}
		}(this))

		this.menu = new Menu(this)
		this.menu.visible = false
		this.addChild(this.menu)

		this.muteSprite = new PIXI.Sprite()
		this.muteSprite.anchor.set(0.5, 0.5)
		this.muteSprite.blendMode = PIXI.BLEND_MODES.ADD_NPM
		this.addChild(this.muteSprite)
		this.muteSprite.addChild(new class extends ButtonBehaviorContainer {
			owner: Cog

			constructor(owner: Cog) {
				super();
				this.owner = owner
				this.hoverChanged()
			}

			clickHappened(): void {
				toggleMuteUnmute()
				playSound("click", true)
				this.owner.onResize(OnResizeFlag.ALL)
			}

			hoverChanged(): void {
				this.owner.muteSprite.alpha = this.isHovered() ? 1 : 0.8
			}

			isAllowedToClick(): boolean {
				return true;
			}

		}(this))

		this.onResize(OnResizeFlag.ALL)
	}

	toggleMenuVisibility() {
		this.menu.visible = !this.menu.visible
		this.onResize(OnResizeFlag.ALL)
	}

	setMenuVisible(v: boolean) {
		this.menu.visible = v
		this.onResize(OnResizeFlag.ALL)
	}

	getCogWidth(): number {
		let viewportSize = D.getViewportSize(this.renderer)
		return Math.min(viewportSize.x / 16, viewportSize.y / 16)
		//return (D.CELL_WIDTH * 3 - D.CELL_HEIGHT * 2 - D.CELL_GAP*2) / 2
	}

	getCogGap(): number {
		return this.getCogWidth() / 1.2 //D.CELL_HEIGHT / 2
	}

	onResize(flag: OnResizeFlag): void {
		let viewportSize = D.getViewportSize(this.renderer)

		this.menu.onResize(flag)

		let width = this.getCogWidth()
		let height = width / WH_IMAGE_RATIO["cog"]
		this.cogSprite.width = width
		this.cogSprite.height = height

		let cogGap = this.getCogGap()

		this.cogSprite.position.set(viewportSize.x - this.cogSprite.width / 2 - cogGap, this.cogSprite.height / 2 + cogGap)

		// GOTCHA: Parent's scale makes child scale smaller correspondingly. This also affects hitArea
		this.cogSprite.getChildAt(0).hitArea = new PIXI.Ellipse(0, 0,
			(this.cogSprite.width / 2) / this.cogSprite.scale.x,
			(this.cogSprite.height / 2) / this.cogSprite.scale.y)

		this.muteSprite.texture = isMuted() ? this.loader.resources["sound-off"].texture : this.loader.resources["sound-on"].texture
		this.muteSprite.width = width
		this.muteSprite.height = width
		this.muteSprite.position.set(this.cogSprite.width / 2 + cogGap, cogGap + this.cogSprite.height / 2)

		this.muteSprite.getChildAt(0).hitArea = new PIXI.Ellipse(0, 0,
			(this.muteSprite.width / 2) / this.muteSprite.scale.x,
			(this.muteSprite.height / 2) / this.muteSprite.scale.y)

		if (this.menu.visible) {
			this.gameBoardBase.filter([new PIXI.filters.BlurFilter(5, 10)])
		} else {
			this.gameBoardBase.filter([])
		}
	}

}

export class Menu extends PIXI.Container implements OnResize {

	cog: Cog

	graphics: PIXI.Graphics

	restartButton: RestartButton

	constructor(cog: Cog) {
		super()
		this.cog = cog

		this.graphics = new PIXI.Graphics()
		this.addChild(this.graphics)
		this.restartButton = new RestartButton(this)
		this.addChild(this.restartButton)
		this.onResize(OnResizeFlag.ALL)
	}

	onResize(flag: OnResizeFlag): void {
		let viewportSize = D.getViewportSize(this.cog.renderer)

		let bgGap = D.CELL_HEIGHT / 4
		this.graphics.clear()
		this.graphics.beginFill(Color.rgb('rgb(134,134,134)').rgbNumber(), 0.5)
		this.graphics.drawRoundedRect(bgGap, bgGap,
			viewportSize.x - bgGap * 2,
			viewportSize.y - bgGap * 2, bgGap * 2)
		this.graphics.endFill()
		this.graphics.beginHole()
		let width = this.cog.getCogWidth()
		let height = width / WH_IMAGE_RATIO["cog"]
		let gap = this.cog.getCogGap()
		this.graphics.drawEllipse(viewportSize.x - width / 2 - gap, gap + height / 2, (width / 2) * 1.5, (height / 2) * 1.5)
		this.graphics.endHole()
		this.restartButton.onResize(flag)
	}
}

export class RestartButton extends PIXI.Container implements OnResize {
	menu: Menu

	graphics: PIXI.Graphics
	sprite: PIXI.Sprite

	constructor(menu: Menu) {
		super();
		this.menu = menu
		this.graphics = new PIXI.Graphics()
		this.addChild(this.graphics)

		this.sprite = new PIXI.Sprite(menu.cog.loader.resources["settings-restart"].texture)
		this.sprite.tint = bgColor
		this.addChild(this.sprite)
		this.graphics.addChild(new class extends ButtonBehaviorContainer {
			owner: RestartButton

			constructor(owner: RestartButton) {
				super();
				this.owner = owner
			}

			clickHappened(): void {
				this.owner.menu.cog.setMenuVisible(false)
				this.owner.menu.cog.gameBoardBase.restartGameCallback(new Array<boolean>())
				playSound("click", true)
			}

			hoverChanged(): void {
				this.owner.alpha = (this.isHovered() && this.isAllowedToClick()) ? 1 : 0.8
			}

			isAllowedToClick(): boolean {
				return true;
			}

		}(this))
		this.onResize(OnResizeFlag.ALL)
	}

	onResize(flag: OnResizeFlag): void {
		let viewportSize = D.getViewportSize(this.menu.cog.renderer)
		this.graphics.clear()
		this.graphics.beginFill(settingsButtonsColor, 1)
		let width = this.menu.cog.getCogWidth()
		let gap = this.menu.cog.getCogGap()

		let buttonH = width

		let ratio = WH_IMAGE_RATIO["settings-restart"]

		// ratio = w / h
		let factor = 0.7
		let fontW = ratio * (buttonH * factor)
		let fontH = buttonH * factor
		this.sprite.width = fontW
		this.sprite.height = fontH
		let buttonW = fontW / factor
		this.sprite.position.set(viewportSize.x - width - gap * 2 - fontW - (buttonW - fontW) / 2, gap + (buttonH - fontH) / 2)


		this.graphics.drawRoundedRect(viewportSize.x - width - gap * 2 - buttonW, gap, buttonW, buttonH, D.CELL_HEIGHT / 2)
		this.graphics.endFill()

		this.graphics.getChildAt(0).hitArea = new PIXI.Rectangle(viewportSize.x - width - gap * 2 - buttonW, gap, buttonW, buttonH)
	}

}