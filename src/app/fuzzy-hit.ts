import * as PIXI from 'pixi.js';

// Interface for button behavior needed by fuzzy hit detection
export interface FuzzyButton {
	isAllowedToClick(): boolean;
	onButtonDown(): void;
	onButtonUp(): void;
	onButtonOver(): void;
	onButtonOut(): void;
	clickHappened(): void;
}

// Fuzzy hit detection: expands hit areas to 2x and picks closest center when overlapping
export interface FuzzyElement {
	container: PIXI.Container;
	button: FuzzyButton;
	getCenterGlobal: () => PIXI.Point;
	getExpandedRadius: () => number;
}

export class FuzzyHitManager {
	private elements: FuzzyElement[] = [];

	register(el: FuzzyElement): void {
		this.elements.push(el);
	}

	unregister(el: FuzzyElement): void {
		const idx = this.elements.indexOf(el);
		if (idx >= 0) this.elements.splice(idx, 1);
	}

	findClosest(globalPoint: PIXI.Point): FuzzyElement | null {
		const candidates: { el: FuzzyElement; dist: number }[] = [];

		for (const el of this.elements) {
			if (!el.container.visible) continue;
			if (!el.button.isAllowedToClick()) continue;

			const center = el.getCenterGlobal();
			const dx = globalPoint.x - center.x;
			const dy = globalPoint.y - center.y;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist <= el.getExpandedRadius()) {
				candidates.push({ el, dist });
			}
		}

		if (candidates.length === 0) return null;

		// Return closest
		candidates.sort((a, b) => a.dist - b.dist);
		return candidates[0].el;
	}

	// For hover: find any element under point (even if not allowed to click)
	findClosestAny(globalPoint: PIXI.Point): FuzzyElement | null {
		const candidates: { el: FuzzyElement; dist: number }[] = [];

		for (const el of this.elements) {
			if (!el.container.visible) continue;

			const center = el.getCenterGlobal();
			const dx = globalPoint.x - center.x;
			const dy = globalPoint.y - center.y;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist <= el.getExpandedRadius()) {
				candidates.push({ el, dist });
			}
		}

		if (candidates.length === 0) return null;
		candidates.sort((a, b) => a.dist - b.dist);
		return candidates[0].el;
	}
}
