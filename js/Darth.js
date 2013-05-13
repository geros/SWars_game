//-----------------------------------------------------------------------------
// Darth.js
//-----------------------------------------------------------------------------

(function (window) {
    // Local bounds used to calculate collision between enemies and the hero
    var localBounds;

    // Index used for the naming of the monsters
    var monsterIndex = 0;

    var globalTargetFPS = 17;

    var StaticTile = new Tile(null, Enum.TileCollision.Passable, 0, 0);

    function Darth(level, position, imgDarth) {
        this.initialize(level, position, imgDarth);
    };

    Darth.prototype = new createjs.BitmapAnimation();

    // constructor:
    Darth.prototype.BitmapAnimation_initialize = Darth.prototype.initialize;

    Darth.prototype.initialize = function (level, position, imgDarth) {
        var width;
        var left;
        var height;
        var top;
        var frameWidth;
        var frameHeight;

        var darthSheet = {
                "animations": {
                    "idle": [0,0, 'idle', 2]
                },
                "images": ["./assets/darthvader.png"],
                "frames": {
                    "regX": 0,
                    "height": 46,
                    "count": 16,
                    "regY": 0,
                    "width": 32
                }
            };

        var localSpriteSheet = new createjs.SpriteSheet(darthSheet);

        createjs.SpriteSheetUtils.addFlippedFrames(localSpriteSheet, true, false, false);

        this.BitmapAnimation_initialize(localSpriteSheet);

        this.x = position.x - 18;
        this.y = position.y - 64 ;
        this.level = level;



        frameWidth = this.spriteSheet.getFrame(0).rect.width;
        frameHeight = this.spriteSheet.getFrame(0).rect.height;

        // Calculate bounds within texture size.
        width = parseInt(frameWidth * 0.35);
        left = parseInt((frameWidth - width) / 2);
        height = parseInt(frameWidth * 0.7);
        top = parseInt(frameHeight - height);
        localBounds = new XNARectangle(left, top, width, height);

        // start playing the first sequence:
        this.gotoAndPlay("idle"); //animate

        // set up a shadow. Note that shadows are ridiculously expensive. You could display hundreds
        // of animated monster if you disabled the shadow.
        if (enableShadows)
            this.shadow = new createjs.Shadow("#000", 3, 2, 2);

        this.name = "Darth";

    };

    Darth.prototype.BoundingRectangle = function () {
        var left = parseInt(Math.round(this.x ) + localBounds.x);
        var top = parseInt(Math.round(this.y ) + localBounds.y);

        return new XNARectangle(left, top, localBounds.width, localBounds.height);
    };

    Darth.prototype.tick = function () {
        // We should normaly try here to compute the elpsed time since
        // the last update. But setTimeout/setTimer functions
        // are not predictable enough to do that. requestAnimationFrame will
        // help when the spec will be stabilized and used properly by all major browsers
        // In the meantime, we're cheating... and living in a perfect 60 FPS world ;-)
        var elapsed = globalTargetFPS / 1000;

        var posX = this.x + (localBounds.width / 2) * this.direction;
        var tileX = Math.floor(posX / StaticTile.Width) - this.direction;
        var tileY = Math.floor(this.y / StaticTile.Height);
    };

    window.Darth = Darth;
} (window));