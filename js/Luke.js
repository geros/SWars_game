//-----------------------------------------------------------------------------
// Luke.js
//-----------------------------------------------------------------------------
/// Our fearless adventurer!
(function (window) {

    var globalTargetFPS = 17;
    var StaticTile = new Tile(null, Enum.TileCollision.Passable, 0, 0);

    // imgLuke should be the PNG containing the sprite sequence
    // level must be of type Level
    // position must be of type Point
    function Luke(imgLuke, level, position ) {
        this.initialize(imgLuke, level, position, screen_width, screen_height);
    }

    // Using EaselJS BitmapSequence as the based prototype
    Luke.prototype = new createjs.BitmapAnimation();
    Luke.prototype.alive = true;
    Luke.prototype.IsAlive = true;
    Luke.prototype.HasReachedExit = false;
    Luke.prototype.x = 0;
    Luke.prototype.y = 0;

    // constructor:
    //unique to avoid overiding base class
    Luke.prototype.BitmapAnimation_initialize = Luke.prototype.initialize;

    var quaterFrameSize;
    var lukeregX;
    var lukeregY;

    /// Constructors a new player.

    Luke.prototype.initialize = function (imgLuke, level, position, x_end, y_end) {

        // initial_position = new createjs.Point(x_start, y_start);

        this.alive = true;

        var width;
        var left;
        var height;
        var top;
        var frameWidth;
        var frameHeight;
        var lukeSheet = {
                "animations": {
                    "move_down": [0, 3, "move_down", 8],
                    "move_left": [4, 7, "walk", 8],
                    "move_right": [8, 11, "move_right", 8],
                    "move_up": [12, 15,"move_up", 8],
                    "idle": [0,0]
                },
                "images": ["assets/luke.png"],
                "frames": {
                    "regX": 0,
                    "height": 46,
                    "count": 16,
                    "regY": 0,
                    "width": 32
                }
            };

        var lukewidth = lukeSheet['frames']['width'];
        var lukeheight = lukeSheet['frames']['height'];
        lukeregX = lukeSheet['frames']['regX'];
        lukeregY = lukeSheet['frames']['regY'];

        var localSpriteSheet = new createjs.SpriteSheet(lukeSheet);


        this.BitmapAnimation_initialize(localSpriteSheet);

        // 1 = right & -1 = left & up =2 & down =-2
        this.direction = 0;
        this.level = level;

        this.x_end = x_end;
        this.y_end = y_end;

        this.x = position.x;
        this.y = position.y ;

        // velocity
        this.vX = 4;
        this.vY = 0;

        this.isJumping = false;

        quaterFrameSize = this.spriteSheet.getFrame(0).rect.width / 4;

        // start playing the first sequence:
        this.gotoAndPlay("idle");   //animate
        this.isInIdleMode = true;

        this.name = "Luke";

        frameWidth = this.spriteSheet.getFrame(0).rect.width;
        frameHeight = this.spriteSheet.getFrame(0).rect.height;

        // Calculate bounds within texture size.
        width = parseInt(frameWidth * 0.4);
        left = parseInt((frameWidth - width) / 2);
        height = parseInt(frameWidth * 0.8);
        top = parseInt(frameHeight - height);

        this.localBounds = new XNARectangle(left, top, width, height);
        // set up a shadow. Note that shadows are ridiculously expensive. You could display hundreds
        // of animated monster if you disabled the shadow.
        if (enableShadows)
            this.shadow = new createjs.Shadow("#000", 3, 2, 2);

        // starting directly at the first frame of the walk_right sequence
        this.currentFrame = 66;

        this.Reset(position);
    };

    /// Resets the player to life.

    /// <param name="position">The position to come to life at.</param>
    Luke.prototype.Reset = function (position) {
        this.x = position.x;
        this.y = position.y;
        this.IsAlive = true;
        this.level.IsHeroDied = false;
        this.gotoAndPlay("idle");
    };

    /// Gets a rectangle which bounds this player in world space.

    Luke.prototype.BoundingRectangle = function () {
        var left = parseInt(Math.round(this.x) + this.localBounds.x);
        var top = parseInt(Math.round(this.y ) + this.localBounds.y);

        return new XNARectangle(left, top, this.localBounds.width, this.localBounds.height);
    };

    /// Handles input, performs physics, and animates the player sprite.

    /// <remarks>
    /// We pass in all of the input states so that our game is only polling the hardware
    /// once per frame. We also pass the game's orientation because when using the accelerometer,
    /// we need to reverse our motion when the orientation is in the LandscapeRight orientation.
    /// </remarks>
    Luke.prototype.tick = function () {
        // It not possible to have a predictable tick/update time
        // requestAnimationFrame could help but is currently not widely and properly supported by browsers
        // this.elapsed = (Ticker.getTime() - this.lastUpdate) / 1000;
        // We're then forcing/simulating a perfect world
        this.elapsed = globalTargetFPS / 1000;
        this.ApplyPhysics();
        if (this.IsAlive && !this.HasReachedExit) {
            // Hit testing the screen width, otherwise our sprite would disappear
            // The player is blocked at each side but we keep the walk_right or walk_animation running
            if (this.direction === 1 || this.direction === -1){
                this.vX = 4;
                this.vY = 0;
                if ((this.x + this.direction > quaterFrameSize) && (this.x + (this.direction * 2) < this.x_end - quaterFrameSize+32 )) {
                    // Moving the sprite based on the direction & the speed
                    this.x += this.vX * this.direction;
                    this.y += this.vY * this.direction / 2;
                }
            }
            else if (this.direction === 2 || this.direction === -2){
                this.vX = 0;
                this.vY = 4;
                if ((this.y  + this.direction > quaterFrameSize) && (this.y + (this.direction* 2) < this.y_end - quaterFrameSize)) {
                    // Moving the sprite based on the direction & the speed
                    this.x += this.vX * this.direction;
                    this.y -= this.vY * this.direction / 2;
                }
            }
        }
    };

    /// Updates the player's velocity and position based on input, gravity, etc.

    Luke.prototype.ApplyPhysics = function () {
        if (this.IsAlive && !this.HasReachedExit) {
            var previousPosition = new createjs.Point(this.x, this.y);

            this.HandleCollisions();

            // If the collision stopped us from moving, reset the velocity to zero.
            if (this.x === previousPosition.x) {
                this.vX = 0;
            }

            if (this.y === previousPosition.y) {
                this.vY = 0;
            }
        }
    };


    /// Detects and resolves all collisions between the player and his neighboring
    /// tiles. When a collision is detected, the player is pushed away along one
    /// axis to prevent overlapping. There is some special logic for the Y axis to
    /// handle platforms which behave differently depending on direction of movement.

    Luke.prototype.HandleCollisions = function () {
        var bounds = this.BoundingRectangle();
        var leftTile = Math.floor(bounds.Left() / StaticTile.Width);
        var rightTile = Math.ceil((bounds.Right() / StaticTile.Width)) - 1;
        var topTile = Math.floor(bounds.Top() / StaticTile.Height);
        var bottomTile = Math.ceil((bounds.Bottom() / StaticTile.Height)) - 1;

        // For each potentially colliding tile,
        for (var y = topTile; y <= bottomTile; ++y) {
            for (var x = leftTile; x <= rightTile; ++x) {
                // If this tile is collidable,
                var collision = this.level.GetCollision(x, y);
                if (collision !== Enum.TileCollision.Passable) {
                    // Determine collision depth (with direction) and magnitude.
                    var tileBounds = this.level.GetBounds(x, y);
                    var depth = bounds.GetIntersectionDepth(tileBounds);
                    if (depth.x !== 0 && depth.y !== 0) {
                        var absDepthX = Math.abs(depth.x);
                        var absDepthY = Math.abs(depth.y);

                        // Resolve the collision along the shallow axis.
                        if (absDepthY < absDepthX || collision == Enum.TileCollision.Platform) {
                            // If we crossed the top of a tile, we are on the ground.

                            // Ignore platforms, unless we are on the ground.
                            if (collision == Enum.TileCollision.Impassable) {
                                // Resolve the collision along the Y axis.
                                this.y = this.y + depth.y;

                                // Perform further collisions with the new bounds.
                                bounds = this.BoundingRectangle();
                            }
                        }
                        else if (collision == Enum.TileCollision.Impassable) // Ignore platforms.
                        {
                            // Resolve the collision along the X axis.
                            this.x = this.x + depth.x;

                            // Perform further collisions with the new bounds.
                            bounds = this.BoundingRectangle();
                        }
                    }
                }
            }
        }

        // Save the new bounds bottom.
        this.previousBottom = bounds.Bottom();
    };

    /// Called when the player has been killed.

    /// <param name="killedBy">
    /// The enemy who killed the player. This parameter is null if the player was
    /// not killed by an enemy (fell into a hole).
    /// </param>
    Luke.prototype.OnKilled = function (killedBy) {
        this.IsAlive = false;
        this.velocity = new createjs.Point(0, 0);

        // Playing the proper animation based on
        // the current direction of our hero
        if (this.direction === 1) {
            this.gotoAndPlay("die_h");
        }
        else {
            this.gotoAndPlay("die");
        }

        if (killedBy !== null && killedBy !== undefined) {
            this.level.levelContentManager.playerKilled.play();
        }
        else {
            this.level.levelContentManager.playerFall.play();
        }
    };

    /// Called when this player reaches the level's exit.

    Luke.prototype.OnReachedExit = function () {
        this.HasReachedExit = true;
        this.level.levelContentManager.exitReached.play();

        // Playing the proper animation based on
        // the current direction of our hero
        if (this.direction === 1) {
            this.gotoAndPlay("celebrate_h");
        }
        else {
            this.gotoAndPlay("celebrate");
        }
    };

    window.Luke = Luke;
} (window));