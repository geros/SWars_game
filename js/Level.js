//-----------------------------------------------------------------------------
// Level.js
//-----------------------------------------------------------------------------

/// A uniform grid of tiles with collections of gems and enemies.
/// The level owns the player and controls the game's win and lose
/// conditions as well as scoring
(function (window) {
    // To display to current FPS
    var fpsLabel;

    // Used to build the background with 3 different layers
    var backgroundSeqTile1, backgroundSeqTile2, backgroundSeqTile3;

    var PointsPerSecond = 5;

    var globalTargetFPS = 17;

    // Index used to loop inside the 8 Audio elements stored into an array
    // Used to simulate multi-channels audio
    var audioLightsaberIndex = 0;
    // Building a matrix of characters that will be replaced by the level {x}.txt

    var StaticTile = new Tile(null, Enum.TileCollision.Passable, 0, 0);

    function Level(stage, contentManager, textLevel, gameWidth, gameHeight) {

        this.levelContentManager = contentManager;
        this.levelStage = stage;

        this.textTiles;
        // Physical structure of the level.
        this.tiles;
        this.walltiles
        //in the {x}.txt file we assume that te matrix rectangular in order to have the rows
        // and columns by doing sqrt({chars}.length)
        this.numcols;

        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        // Entities in the level.
        this.Luke = null;
        this.Lightsabers = [];
        this.Enemies = [];
        // Key locations in the level.
        this.Start = null;
        this.Exit = new createjs.Point(-1, -1);
        this.Score = 0;

        this.ReachedExit = false;
        this.IsLukeDied = false;
        // You've got 10s to finish the level
        this.TimeRemaining = 30;
        // Saving when at what time you've started the level
        this.InitialGameTime = createjs.Ticker.getTime();

        this.LoadTiles(textLevel);
    };


    /// Unloads the level content.
    Level.prototype.Dispose = function () {
        this.levelStage.removeAllChildren();
        this.levelStage.update();
        try {
            this.levelContentManager.globalMusic.pause();
        }
        catch (err) { }
    };

    // Transforming the long single line of text into
    // a 2D array of characters
    Level.prototype.ParseLevelLines = function (levelLine) {
        // initiate
        this.numcols = Math.sqrt(levelLine.length);

        // Building a matrix of characters that will be replaced by the level {x}.txt
        this.textTiles = Array.matrix(this.numcols, this.numcols, "|");
        // Physical structure of the level.
        this.tiles = Array.matrix(this.numcols, this.numcols, "|");
        // Strucrure to hold tiles that prevent Luke from escaping outside board

        this.walltiles = Array.matrix(this.numcols, this.numcols, "|");

        for (var i = 0; i < this.numcols; i++) {
            for (var j = 0; j < this.numcols; j++) {
                this.textTiles[i][j] = levelLine[(i * this.numcols) + j];
            }
        }
    };


    /// Iterates over every tile in the structure file and loads its
    /// appearance and behavior. This method also validates that the
    /// file is well-formed with a player start point, exit, etc.
    /// <param name="fileStream">
    /// A string containing the tile data.
    /// </param>
    Level.prototype.LoadTiles = function (fileStream) {
        this.ParseLevelLines(fileStream);

        // Loop over every tile position,
        for (var i = 0; i < this.numcols; i++) {
            for (var j = 0; j < this.numcols; j++) {
                if (i==0 || i== this.numcols-1 || j == this.numcols -1 || j===0){
                    // this.levelStage.addChild(this.LoadBlankTile(j, i));
                    this.walltiles[i][j] = this.LoadNamedTile("blank",  Enum.TileCollision.Impassable, j, i);
                    this.levelStage.addChild(this.LoadNamedTile("blank",  Enum.TileCollision.Impassable, j, i));
                }
                else{
                    this.levelStage.addChild(this.LoadNamedTile("BlockA0",  Enum.TileCollision.Passable, j, i));
                }
            }
        }

        // Loop over every tile position,
        for (var i = 0; i < this.numcols; i++) {
            for (var j = 0; j < this.numcols; j++) {
                this.tiles[i][j] = this.LoadTile(this.textTiles[i][j], j, i);
            }
        }

        // Verify that the level has a beginning and an end.
        if (this.Luke == null) {
            throw "A level must have a starting point.";
        }
        if (this.Exit.x === -1 && this.Exit.y === -1) {
            throw "A level must have an exit.";
        }
    };


    /// Loads an individual tile's appearance and behavior.
    /// <param name="tileType">
    /// The character loaded from the structure file which
    /// indicates what should be loaded.
    /// </param>
    /// <param name="x">
    /// The X location of this tile in tile space.
    /// </param>
    /// <param name="y">
    /// The Y location of this tile in tile space.
    /// </param>
    /// <returns>The loaded tile.</returns>
    Level.prototype.LoadTile = function (tileType, x, y) {
        switch (tileType) {
            case 'X':
                return this.LoadExitTile(x, y);
                break;
            // Lightsaber
            case 'G':
                return this.LoadLightsaberTile(x, y);
                break;

            // Various enemies
            case 'D':
                return this.LoadDarthTile(x, y, "Darth");
                break;
            //Player 1 start point
            case '1':
                return this.LoadStartTile(x, y);
                break;

        }
    };


    /// Creates a new tile. The other tile loading methods typically chain to this
    /// method after performing their special logic.
    /// <param name="collision">
    /// The tile collision type for the new tile.
    /// </param>
    /// <returns>The new tile.</returns>
    Level.prototype.LoadNamedTile = function (name, collision, x, y) {
        switch (name) {
            case "Platform":
                return new Tile(this.levelContentManager.imgPlatform, collision, x, y);
                break;

            case "Exit":
                return new Tile(this.levelContentManager.imgMoon, collision, x, y);
                break;

            case "BlockA0":
                return new Tile(this.levelContentManager.imgBlockA0, collision, x, y);
                break
             case "Earth":
                return new Tile(this.levelContentManager.imgEarth, collision, x, y);
                break;
             case "Moon":
                return new Tile(this.levelContentManager.imgMoon, collision, x, y);
                break;
            case "blank":
                return new Tile(this.levelContentManager.imgBlank, collision, x, y);
                break;
        }
    };


    /// Loads a tile with a random appearance.
    /// <param name="baseName">
    /// The content name prefix for this group of tile variations. Tile groups are
    /// name LikeThis0.png and LikeThis1.png and LikeThis2.png.
    /// </param>
    /// <param name="variationCount">
    /// The number of variations in this group.
    /// </param>
    Level.prototype.LoadVarietyTile = function (baseName, variationCount, collision, x, y) {
        var index = Math.floor(Math.random() * (variationCount - 1));
        return this.LoadNamedTile(baseName + index, collision, x, y);
    };

    Level.prototype.LoadExitTile = function (x, y) {
        if (this.Exit.x !== -1 & this.Exit.y !== y) {
            throw "A level may only have one exit.";
        }

        this.Exit = this.GetBounds(x, y).Center;

        return this.LoadNamedTile("Exit", Enum.TileCollision.Passable, x, y);
    };

    /// Instantiates a player, puts him in the level, and remembers where to put him when he is resurrected.
    Level.prototype.LoadStartTile = function (x, y) {

        if (this.Luke != null) {
            throw "A level may only have one starting point.";
        }
        this.Start = this.GetBounds(x, y).GetBottomCenter();

        this.Luke = new Luke(this.levelContentManager.imgLuke, this, this.Start);
        return new Tile(null, Enum.TileCollision.Passable, x , y);
    };


    /// Instantiates a gem and puts it in the level.
    Level.prototype.LoadGroundTile = function (x, y) {
        position = this.GetBounds(x, y).Center;
        var position = new createjs.Point(x, y);
        this.GroundTiles.push();
        return new Tile(null, Enum.TileCollision.Impassable, x, y);
    };


    /// Instantiates a gem and puts it in the level.
    Level.prototype.LoadLightsaberTile = function (x, y) {
        position = this.GetBounds(x, y).Center;
        var position = new createjs.Point(x, y);
        this.Lightsabers.push(new Lightsaber(this.levelContentManager.imgLightsaber, this, position));
       return new Tile(null, Enum.TileCollision.Passable, x, y);
    };


    /// Instantiates an enemy and puts him in the level.
    Level.prototype.LoadDarthTile = function (x, y, name) {
        var position = this.GetBounds(x, y).GetBottomCenter();

        this.Enemies.push(new Darth(this, position, this.levelContentManager.imgDarth));
        return new Tile(null, Enum.TileCollision.Passable, x, y);
    };

    // <summary>
    /// Instantiates an enemy and puts him in the level.
    Level.prototype.LoadBlankTile = function (x, y) {
        var position = this.GetBounds(x, y).GetBottomCenter();
        return this.LoadNamedTile("blank", Enum.TileCollision.Impassable, x, y);
    };

    /// Gets the bounding rectangle of a tile in world space.
    Level.prototype.GetBounds = function (x, y) {
        return new XNARectangle(x * StaticTile.Width, y * StaticTile.Height, StaticTile.Width, StaticTile.Height);
    };

    /// Width of level measured in tiles.
    Level.prototype.Width = function () {
        return 20;
    };

    /// Height of the level measured in tiles.
    Level.prototype.Height = function () {
        return 15;
    };

    /// Gets the collision mode of the tile at a particular location.
    /// This method handles tiles outside of the levels boundries by making it
    /// impossible to escape past the left or right edges, but allowing things
    /// to jump beyond the top of the level and fall off the bottom.
    Level.prototype.GetCollision = function (x, y) {
        // Prevent escaping past the level ends.
        if (x < 0 || x >= this.Width()) {
            return Enum.TileCollision.Impassable;
        }
        // Allow jumping past the level top and falling through the bottom.
        if (y < 0 || y >= this.Height()) {
            return Enum.TileCollision.Passable;
        }
        try {
            return this.tiles[y][x].Collision;
        }
        catch(err){
            return this.walltiles[y][x].Collision;
        }
    };

    // Method to call once everything has been setup in the level
    // to simply start it
    Level.prototype.StartLevel = function () {
        // Adding all tiles to the EaselJS Stage object
        // This is the platform tile where the hero & enemies will
        // be able to walk onto

        for (var i = 0; i < this.numcols; i++) {
            for (var j = 0; j < this.numcols; j++) {

                if (!!this.tiles[i][j] && !this.tiles[i][j].empty) {
                    this.levelStage.addChild(this.tiles[i][j]);

                }
            }
        }

        // Adding the gems to the stage
        for (var i = 0; i < this.Lightsabers.length; i++) {
            this.levelStage.addChild(this.Lightsabers[i]);
        }

        // Adding all the enemies to the stage
        for (var i = 0; i < this.Enemies.length; i++) {
            this.levelStage.addChild(this.Enemies[i]);
        }

        // Adding our brillant hero
        this.levelStage.addChild(this.Luke);
        // Playing the background music

        // add a text object to output the current FPS:
        fpsLabel = new createjs.Text("-- fps", "bold 14px Arial", "#000");
        this.levelStage.addChild(fpsLabel);

        fpsLabel.x = (this.numcols + 1) * 46 ;
        fpsLabel.y = 20;
    };

    /// Updates all objects in the world, performs collision between them,
    /// and handles the time limit with scoring.
    Level.prototype.Update = function () {
        var ElapsedGameTime = (createjs.Ticker.getTime() - this.InitialGameTime) / 1000;
        this.Luke.tick();

        if (!this.Luke.IsAlive || this.TimeRemaining === 0) {
            this.Luke.ApplyPhysics();
        }
        else if (this.ReachedExit) {
            var seconds = parseInt((globalTargetFPS / 1000) * 200);
            seconds = Math.min(seconds, parseInt(Math.ceil(this.TimeRemaining)));
            this.TimeRemaining -= seconds;
            this.Score += seconds * PointsPerSecond;
        }
        else {
            this.TimeRemaining = 30 - ElapsedGameTime;
            if (!this.IsLukeDied)
                this.UpdateLightsabers();

            if (this.Luke.BoundingRectangle().Top() >= this.Height() * StaticTile.Height) {
                this.OnPlayerKilled();
            }

            this.UpdateEnemies();
            if (this.Luke.IsAlive &&
                    this.Luke.BoundingRectangle().ContainsPoint(this.Exit)) {
                this.OnExitReached();
            }
        }


        // Clamp the time remaining at zero.
        if (this.TimeRemaining < 0)
            this.TimeRemaining = 0;

        fpsLabel.text = Math.round(createjs.Ticker.getMeasuredFPS()) + " fps";

        // update the stage:
        this.levelStage.update();
    };


    /// Animates each gem and checks to allows the player to collect them.
    Level.prototype.UpdateLightsabers = function () {
        for (var i = 0; i < this.Lightsabers.length; i++) {
            this.Lightsabers[i].tick();
            if (this.Lightsabers[i].BoundingRectangle().Intersects(this.Luke.BoundingRectangle())) {
                // We remove it from the drawing surface
                this.levelStage.removeChild(this.Lightsabers[i]);
                this.Score += this.Lightsabers[i].PointValue;
                // We then remove it from the in memory array
                this.Lightsabers.splice(i, 1);
                // And we finally play the gem collected sound using a multichannels trick
                this.levelContentManager.gemCollected[0].play();
                audioLightsaberIndex++;
            }
        }
    };


    /// Animates each enemy and allow them to kill the player.
    Level.prototype.UpdateEnemies = function () {
        for (var i = 0; i < this.Enemies.length; i++) {
            if (this.Luke.IsAlive && this.Enemies[i].BoundingRectangle().Intersects(this.Luke.BoundingRectangle())) {
                this.OnLukeKilled(this.Enemies[i]);
                // Forcing a complete rescan of the Enemies Array to update them that the hero is dead
                i = 0;
            }
            this.Enemies[i].tick();
        }
    };

    Level.prototype.OnExitReached = function () {
        this.Luke.OnReachedExit();
        this.ReachedExit = true;
    };

    Level.prototype.OnLukeKilled = function (killedBy) {
        this.IsLukeDied = true;
        this.Luke.OnKilled(killedBy);
    };


    Level.prototype.StartNewLife = function () {
        this.Luke.Reset(this.Start);
    };
    window.Level = Level;
} (window));