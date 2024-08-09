# Start webpack-dev-server

Without teh prompt `Y/N` to terminate batch file:
```
$ webpack-dev-server <nul
$ live-server <nul
```

Just wrapped that into a `debug.bat`


# Fix npm issues

```bash
$ npm clean cache --force
```

# https locally

Just used `mkcert` to locally generate `pem`, `key`.

# Compilation of TypeScript manually

Compiles `.ts` files and places them in `/web` due to `tsconfig.json` setting:

```shell
$ tsc
```

VSC: shortcut for building: `Ctrl+Shift+B` (tsc watch will run compiler in background and watch for changes.)

Debugging relies on `.map` files, so `"sourceMap": true` is the setting for that (equal to `--sourcemap` in command line).

Running compiled file in `node`:

```shell
$ node hello.js
```

# PWA - Workbox

https://developers.google.com/web/tools/workbox

# PWA Builder

Thing to try after PWA is finished.
https://www.pwabuilder.com

# Install

Install pixi locally, browserify globally:
```
$ npm i pixi.js
$ npm i pixi-sound --save
$ npm i -g browserify
$ npm i --save-dev tinyify
```

```
npm i color
npm i --save @types/color
```

# Easings

https://easings.net/

# Customizing PIXI

https://pixijs.io/customize/

# Tiles

Using https://www.codeandweb.com/texturepacker to create texture tiles
or renderhjs.net/shoebox or spritesheet.js

# Gotchas

* Changing width / height of a parent causes children to proportionally change their width and height.
    https://github.com/pixijs/pixi.js/issues/6393
* `DisplayObject` (such as a `Sprite` or another `Container`) can only belong to one parent at a time. If you use `addChild` to make a sprite the child of another object, Pixi will automatically remove it from its current parent.

# Adding Custom Properties

```ts
// Adding custom property to an object
let sp = new PIXI.Sprite();
(<any>sp).something = "test0"
```


# Cloning an object

```ts
const targetMovablePos = movableShip.position.clone();
```

# Stuff to Explore

## Matrix / Transforms

https://pixijs.download/v5.2.4/docs/PIXI.Matrix.html
https://medium.com/swlh/understanding-3d-matrix-transforms-with-pixijs-c76da3f8bd8
https://medium.com/swlh/inside-pixijs-display-objects-and-their-hierarchy-2deef1c01b6e

## ObservablePoint

https://pixijs.download/v5.2.4/docs/PIXI.ObservablePoint.html

# Interesting tools for PixiJS

https://github.com/pixijs/pixi.js/wiki/v5-Resources
https://github.com/jedateach/pixijs-free-transform-tool
// https://github.com/pixijs/pixi.js/wiki/v5-Migration-Guide
// https://pixijs.download/v5.2.3/docs/index.html
// https://pixijs.io/examples/?v=v5.2.3#/demos-advanced/slots.js

https://ptsjs.org
https://github.com/pixijs/pixi-haxe
https://github.com/gajus/scream

https://heaps.io/
https://www.openfl.org/

https://www.infoq.com/news/2019/05/pixi-webgl-html5-v5-games/

# Rendering HTML Text

https://github.com/pixijs/pixi-html-text

# Example With Classes

https://github.com/ANVoevodin/pixijs_v5_endless_background

# App script:

```ts
import { Application } from '@pixi/app'

import Background from './components/Background'
import Ground from './components/Ground'
import Clouds from './components/Clouds'
import Player from './components/Player'

export default class App extends Application {
    constructor() {
        super({
            width: window.innerWidth,
            height: window.innerHeight
        })
        document.body.appendChild(this.view) // Create Canvas tag in the body

        // Calling a method of this class
        this.init()

        // Binding to local method:
        window.addEventListener('resize', this.onResize.bind(this))
    }
    
    init() {
      // Load resources ...
      this.loader.add('clouds', './assets/clouds.png')
      // draw() when finished
      this.loader.load(this.draw.bind(this))
    }
    
    draw() {
        this.background = new Background()
        this.ground = new Ground()
        this.clouds = new Clouds()
        this.player = new Player()
        
        // Adding all the child in one move
        this.stage.addChild(this.background, this.ground, this.clouds, this.player)

        this.onResize()
        
        // Create an update loop
        this.ticker.add(this.onUpdate.bind(this))            
    }
    
    onUpdate(delta) {
        this.ground.onUpdate(delta)
        this.clouds.onUpdate(delta)
    }

    onResize() {
        this.renderer.resize(window.innerWidth, window.innerHeight)
        const width = this.renderer.width, height = this.renderer.height
        this.background.onResize(width, height)
        this.ground.onResize(width, height)
        this.clouds.onResize(width, height)
        this.player.onResize(width, height)
    }    
}
```

# Background object:

```ts
import { Texture } from '@pixi/core'
import { Sprite } from '@pixi/sprite'

export default class Background extends Sprite {
    constructor() {
        super(Texture.from('bg'))
    }

    onResize(width, height) {
        this.width = width
        this.height = height
    }
}
```

# Clouds object:

```ts
import { Texture } from '@pixi/core'
import { TilingSprite } from '@pixi/sprite-tiling'

export default class Clouds extends TilingSprite {
    constructor() {
        const texture = Texture.from('clouds')
        super(texture, 1, texture.height) //width 1 because we will call onResize from App anyway
    }

    onResize(width, height) {
        this.width = width
    }

    onUpdate(delta) {
    	this.tilePosition.x -= delta * 4
    }
}
```

# Ground object:

```ts
import { Texture } from '@pixi/core'
import { TilingSprite } from '@pixi/sprite-tiling'

export default class Background extends TilingSprite {
    constructor() {
        const texture = Texture.from('ground')
        super(texture, 1, texture.height) //width 1 because we will call onResize from App anyway
    }

    onResize(width, height) {
        this.width = width
        this.y = height - this.height
    }

    onUpdate(delta) {
    	this.tilePosition.x -= delta * 2
    }
}
```

# Player object:

(Uses "animejs": "^3.0.1")

```ts
import { Texture } from '@pixi/core'
import { Sprite } from '@pixi/sprite'
import anime from 'animejs'

export default class Background extends Sprite {
    constructor() {
        super(Texture.EMPTY)
        
        this.sprite = Sprite.from('player')
        this.sprite.anchor.set(0.5)
        this.addChild(this.sprite)

        this.animate()
    }

    animate() {
        anime({
            targets: this.sprite,
            x: {
                value: 25,
                duration: 2000,
                easing: 'easeInOutCubic'
            },
            loop: true,
            direction: 'alternate'
        })

        anime({
            targets: this.sprite,
            duration: 750,
            y: {
                value: 10,
                easing: 'easeInOutQuad'
            },
            loop: true,
            direction: 'alternate'
        })

        const angle = 0.02
        this.sprite.rotation = angle
        anime({
            targets: this.sprite,
            duration: 1000,
            rotation: {
                value: -angle,
                easing: 'easeInOutQuad'
            },
            loop: true,
            direction: 'alternate'
        })
    }

    onResize(width, height) {
        this.x = width * 0.2
        this.y = height * 0.5
    }
}
```


# Main script:

```ts
// Import Application class that is the main part of our PIXI project
import { Application } from '@pixi/app'

// In order that PIXI could render things we need to register appropriate plugins
import { Renderer } from '@pixi/core' // Renderer is the class that is going to register plugins

import { BatchRenderer } from '@pixi/core' // BatchRenderer is the "plugin" for drawing sprites
Renderer.registerPlugin('batch', BatchRenderer)

import { TilingSpriteRenderer } from '@pixi/sprite-tiling' // TilingSpriteRenderer is the plugin for drawing tiling sprites, which is the key solution for our "endless sprites" task
Renderer.registerPlugin('tilingSprite', TilingSpriteRenderer)

import { TickerPlugin } from '@pixi/ticker' // TickerPlugin is the plugin for running an update loop (it's for the application class)
Application.registerPlugin(TickerPlugin)

// And just for convenience let's register Loader plugin in order to use it right from Application instance like app.loader.add(..) etc.
import { AppLoaderPlugin } from '@pixi/loaders'
Application.registerPlugin(AppLoaderPlugin)

import App from './App'

new App()
```


# Parsing XML 
```
var xmlTextString:String = new js.html.XMLSerializer().serializeToString(loader.resources.text.data.childNodes[0]);
var XML = Xml.parse(xmlTextString);
```