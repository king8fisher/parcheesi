export function clamp(min: number, max: number, value: number): number {
	if (value < min) return min;
	if (value > max) return max;
	return value;
}

export function floatMod(a: number, b: number): number {
	a /= b;
	a -= Math.floor(a);
	return a * b;
}

export function getLinearY(x0: number, y0: number, x1: number, y1: number, x: number): number {
	return (y1 - y0) * (x - x0) * (x - x0) / (x1 - x0) + y0;
}

// Basic lerp funtion.
export function lerp(a1: number, a2: number, t: number) {
	return a1 * (1 - t) + a2 * t;
}

// Backout function from tweenjs.
// https://github.com/CreateJS/TweenJS/blob/master/src/tweenjs/Ease.js
export function backout(amount: number) {
	return (t: number) => (--t * t * ((amount + 1) * t + amount) + 1);
}

export function destroyAllImages() {
	Object.keys(PIXI.utils.TextureCache).forEach(texture => {
		console.log("Destroying..." + texture);
		try {
			PIXI.utils.TextureCache[texture].destroy(true);
		} catch {
		}
	});
}

export function frame(source: any, x: number, y: number, width: number, height: number): PIXI.Texture {
	let texture: PIXI.Texture;
	//If the source is a string, it's either a texture in the
	//cache or an image file
	if (typeof source === "string") {
		if (PIXI.utils.TextureCache[source]) {
			texture = new PIXI.Texture(PIXI.utils.TextureCache[source]);
		}
	}//If the `source` is a texture,  use it
	else if (source instanceof PIXI.Texture) {
		texture = new PIXI.Texture((source as PIXI.Texture).baseTexture);
	}
	if (!texture) {
		console.log(`Please load the ${source} texture into the cache.`);
	} else {
		//Make a rectangle the size of the sub-image
		texture.frame = new PIXI.Rectangle(x, y, width, height);
		return texture;
	}
	return null;
}

function updateTransformOnlyTranslate(parentTransform: PIXI.Transform) {
	// SAME CODE AS IN DEFAULT UPDATE TRANSFORM
	const lt = this.localTransform;

	if (this._localID !== this._currentLocalID) {
		lt.a = this._cx * this.scale._x;
		lt.b = this._sx * this.scale._x;
		lt.c = this._cy * this.scale._y;
		lt.d = this._sy * this.scale._y;

		lt.tx = this.position._x - ((this.pivot._x * lt.a) + (this.pivot._y * lt.c));
		lt.ty = this.position._y - ((this.pivot._x * lt.b) + (this.pivot._y * lt.d));
		this._currentLocalID = this._localID;
		this._parentID = -1;
	}

	if (this._parentID !== (<any>parentTransform)._worldID) {
		// concat the parent matrix with the objects transform.
		const pt = parentTransform.worldTransform;
		const wt = this.worldTransform;

		//===== here is the trick
		wt.a = lt.a;
		wt.b = lt.b;
		wt.c = lt.c;
		wt.d = lt.d;
		//===== changes end
		wt.tx = (lt.tx * pt.a) + (lt.ty * pt.c) + pt.tx;
		wt.ty = (lt.tx * pt.b) + (lt.ty * pt.d) + pt.ty;

		this._parentID = (<any>parentTransform)._worldID;
		this._worldID++;
	}
}

function hackTransform(element: PIXI.Container) {
	element.transform.updateTransform = updateTransformOnlyTranslate;
}


// radians = degrees * (Math.PI / 180);
// degrees = radians * (180 / Math.PI);
// Math.random()
//
// arrayName.push(item)
// arrayName.length

export var tweenFunctions = {
	// t - current time, b - beginning value, _c - final value, d - total duration
	linear: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		return c * t / d + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInQuad: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		return c * (t /= d) * t + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeOutQuad: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		return -c * (t /= d) * (t - 2) + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInOutQuad: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		if ((t /= d / 2) < 1) {
			return c / 2 * t * t + b;
		} else {
			return -c / 2 * ((--t) * (t - 2) - 1) + b;
		}
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInCubic: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		return c * (t /= d) * t * t + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeOutCubic: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		return c * ((t = t / d - 1) * t * t + 1) + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInOutCubic: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		if ((t /= d / 2) < 1) {
			return c / 2 * t * t * t + b;
		} else {
			return c / 2 * ((t -= 2) * t * t + 2) + b;
		}
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInQuart: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		return c * (t /= d) * t * t * t + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeOutQuart: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		return -c * ((t = t / d - 1) * t * t * t - 1) + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInOutQuart: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		if ((t /= d / 2) < 1) {
			return c / 2 * t * t * t * t + b;
		} else {
			return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
		}
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInQuint: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		return c * (t /= d) * t * t * t * t + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeOutQuint: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInOutQuint: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		if ((t /= d / 2) < 1) {
			return c / 2 * t * t * t * t * t + b;
		} else {
			return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
		}
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInSine: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeOutSine: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		return c * Math.sin(t / d * (Math.PI / 2)) + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInOutSine: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInExpo: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeOutExpo: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInOutExpo: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		if (t === 0) {
			return b;
		}
		if (t === d) {
			return b + c;
		}
		if ((t /= d / 2) < 1) {
			return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
		} else {
			return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
		}
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInCirc: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeOutCirc: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInOutCirc: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		if ((t /= d / 2) < 1) {
			return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
		} else {
			return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
		}
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInElastic: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		let a, p, s;
		s = 1.70158;
		p = 0;
		a = c;
		if (t === 0) {
			return b;
		} else if ((t /= d) === 1) {
			return b + c;
		}
		if (!p) {
			p = d * 0.3;
		}
		if (a < Math.abs(c)) {
			a = c;
			s = p / 4;
		} else {
			s = p / (2 * Math.PI) * Math.asin(c / a);
		}
		return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeOutElastic: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		let a, p, s;
		s = 1.70158;
		p = 0;
		a = c;
		if (t === 0) {
			return b;
		} else if ((t /= d) === 1) {
			return b + c;
		}
		if (!p) {
			p = d * 0.3;
		}
		if (a < Math.abs(c)) {
			a = c;
			s = p / 4;
		} else {
			s = p / (2 * Math.PI) * Math.asin(c / a);
		}
		return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInOutElastic: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		let a, p, s;
		s = 1.70158;
		p = 0;
		a = c;
		if (t === 0) {
			return b;
		} else if ((t /= d / 2) === 2) {
			return b + c;
		}
		if (!p) {
			p = d * (0.3 * 1.5);
		}
		if (a < Math.abs(c)) {
			a = c;
			s = p / 4;
		} else {
			s = p / (2 * Math.PI) * Math.asin(c / a);
		}
		if (t < 1) {
			return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
		} else {
			return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
		}
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInBack: function (t: number, b: number, _c: number, d: number, s: number) {
		let c = _c - b;
		if (s === void 0) {
			s = 1.70158;
		}
		return c * (t /= d) * t * ((s + 1) * t - s) + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeOutBack: function (t: number, b: number, _c: number, d: number, s: number) {
		let c = _c - b;
		if (s === void 0) {
			s = 1.70158;
		}
		return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInOutBack: function (t: number, b: number, _c: number, d: number, s: number) {
		let c = _c - b;
		if (s === void 0) {
			s = 1.70158;
		}
		if ((t /= d / 2) < 1) {
			return c / 2 * (t * t * (((s *= 1.525) + 1) * t - s)) + b;
		} else {
			return c / 2 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2) + b;
		}
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInBounce: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		let v;
		v = tweenFunctions.easeOutBounce(d - t, 0, c, d);
		return c - v + b;
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeOutBounce: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		if ((t /= d) < 1 / 2.75) {
			return c * (7.5625 * t * t) + b;
		} else if (t < 2 / 2.75) {
			return c * (7.5625 * (t -= 1.5 / 2.75) * t + 0.75) + b;
		} else if (t < 2.5 / 2.75) {
			return c * (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375) + b;
		} else {
			return c * (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375) + b;
		}
	},
	// t - current time, b - beginning value, _c - final value, d - total duration
	easeInOutBounce: function (t: number, b: number, _c: number, d: number) {
		let c = _c - b;
		let v;
		if (t < d / 2) {
			v = tweenFunctions.easeInBounce(t * 2, 0, c, d);
			return v * 0.5 + b;
		} else {
			v = tweenFunctions.easeOutBounce(t * 2 - d, 0, c, d);
			return v * 0.5 + c * 0.5 + b;
		}
	}
};

// export function hex2string(hex: number) {
// 	return '#' + ('000000' + (hex | 0).toString(16)).slice(-6);
// }