//-----------------------------------------------------------------------------
// Game.js
//-----------------------------------------------------------------------------


(function (window) {
    //usefull keycodes
    var KEYCODE_SPACE = 32;
    var KEYCODE_UP = 38;
    var KEYCODE_DOWN = 40;
    var KEYCODE_LEFT = 37;
    var KEYCODE_RIGHT = 39;
    var KEYCODE_W = 87;
    var KEYCODE_A = 65;
    var KEYCODE_D = 68;
    var KEYCODE_S = 83;

    // Displaying the timer in red under 30s of remaining time
    var numberOfLevels = 2;

    // Used in case of an HTTP issue or access denied on file://
    // This is a static level. So if you're looping always on the same level
    // You're stuck in the Matrix because of an exception somewhere... Up to you to find where!
    var hardcodedErrorTextLevel = ".....................................................................................................................................................GGG.................###................................GGG.......GGG.......###...--..###........................1................X.####################";

    // Variables used to handle the overlay canvas to display "You died", "You win", etc.
    var statusCanvas = null;
    var statusCanvasCtx = null;
    var overlayEnabled = true;
    var scoreText = null;

    var WarningTime = 30;


    function Game(stage, contentManager, gameWidth, gameHeight) {
        this.GameStage = stage;
        this.GameContentManager = contentManager;

        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;

        this.levelIndex = -1;
        this.level = null;

        this.wasContinuePressed = false;
        this.continuePressed = false;
        // // Preparing the overlay canvas for future usage
        this.SetOverlayCanvas();

        // Little closure needed here
        var instance = this; // store the current context

        // Our hero can be moved with the arrow keys (left, right,up,down)
        document.onkeydown = function (e) {
            instance.handleKeyDown(e);
        };

        document.onkeyup = function (e) {
            instance.handleKeyUp(e);
        };

        this.LoadNextLevel();
    };

    // Update logic callbacked by EaselJS
    // Equivalent of the Update() method of XNA
    Game.prototype.tick = function () {
        // try {
            if (this.level !== null) {

                this.HandleInput();
                this.level.Update();
                this.UpdateScore();

                // If the hero died or won, display the appropriate overlay
                if (overlayEnabled) {
                    this.DrawOverlay();
                }
            }
        // }
        // catch (e) {
        //     console.log('Error', e);
        // }
    };

    // Starting the game
    Game.prototype.StartGame = function () {

        // we want to do some work before we update the canvas,
        // otherwise we could use Ticker.addListener(stage);
        createjs.Ticker.addListener(this);
        // Targeting 60 FPS
        createjs.Ticker.useRAF = enableRAF;
        createjs.Ticker.setFPS(60);
    };

    // Well, the method's name should be self explicit ;-)
    Game.prototype.UpdateScore = function () {

        if (scoreText === null) {
            timeRemainingText = new createjs.Text("TIME: ", "bold 14px Arial", "yellow");
            timeRemainingText.x = (this.level.numcols + 1) * 46;;
            timeRemainingText.y = 0;
            this.GameStage.addChild(timeRemainingText);

            scoreText = new createjs.Text("SCORE: 0", "bold 14px Arial", "green");
            scoreText.x = (this.level.numcols + 1) * 46;
            scoreText.y = 40;
            this.GameStage.addChild(scoreText);
        }

        if (this.level.TimeRemaining < WarningTime && !this.level.ReachedExit) {
            timeRemainingText.color = "red";
        }
        else {
            timeRemainingText.color = "yellow";
        }

        scoreText.text = "SCORE: " + this.level.Score;
        timeRemainingText.text = "TIME: " + parseInt(this.level.TimeRemaining);
    };

    // Perform the appropriate action to advance the game and
    // to get the player back to playing.
    Game.prototype.HandleInput = function () {

        if (!this.wasContinuePressed && this.continuePressed) {
            if (!this.level.Luke.IsAlive) {
                this.HideStatusCanvas();
                 this.level.StartNewLife();
            }
            else if (this.level.TimeRemaining == 0) {
                if (this.level.ReachedExit)
                    this.LoadNextLevel();
                else
                    this.ReloadCurrentLevel();
            }
        }

        this.wasContinuePressed = this.continuePressed;
    };

    // Determine the status overlay message to show.
    Game.prototype.DrawOverlay = function () {
        var status = null;
        if (this.level.TimeRemaining == 0) {
            if (this.level.ReachedExit) {
                status = this.GameContentManager.winOverlay;
            }
            else {
                status = this.GameContentManager.loseOverlay;
            }
        }
        if (!this.level.Luke.IsAlive) {
            status = this.GameContentManager.diedOverlay;
        }

        if (status !== null) {
            this.ShowStatusCanvas(status);
        }
    };

    // Creating a second canvas to display it over the main gaming canvas
    // It's displayed in style:absolute
    // It is used to display to proper overlay contained in /overlays folder
    // with some opacity effect
    Game.prototype.SetOverlayCanvas = function () {

        var oneOfThisOverlay = this.GameContentManager.loseOverlay;

        statusCanvas = document.createElement("canvas");

        document.body.appendChild(statusCanvas);
        statusCanvasCtx = statusCanvas.getContext("2d");

        statusCanvas.setAttribute('width', oneOfThisOverlay.width);
        statusCanvas.setAttribute('height', oneOfThisOverlay.height);
        // We center it
        var statusX = (this.gameWidth ) / 2;
        var statusY = (this.gameHeight ) / 2;
        statusCanvas.style.position = 'absolute';
        statusCanvas.style.top = statusY + "px";
        statusCanvas.style.left = statusX + "px";
    };

    // Cleaning the previous overlay canvas and setting it visible
    // with the new overlay image
    Game.prototype.ShowStatusCanvas = function (status) {
        statusCanvas.style.display = "block";
        statusCanvasCtx.clearRect(0, 0, status.width, status.height);
        statusCanvasCtx.drawImage(status, 0, 0);
        overlayEnabled = false;
    };

    // Hiding the overlay canvas while playing the game
    Game.prototype.HideStatusCanvas = function () {
        overlayEnabled = true;
        statusCanvas.style.display = "none";
    };

    // Loading the next level contained into /level/{x}.txt
    Game.prototype.LoadNextLevel = function () {
        this.levelIndex = (this.levelIndex + 1) % numberOfLevels;

        // Searching where we are currently hosted
        var nextLevelUrl = window.location.href.replace('game.html', '') + "levels/" + this.levelIndex + ".txt";
        try {
            var request = new XMLHttpRequest();
            request.open('GET', nextLevelUrl, true);

            // Little closure
            var instance = this;
            request.onreadystatechange = function () {
                instance.OnLevelReady(this);
            };
            request.send(null);
        }
        catch (e) {
            console.log('asasasas');
            // Probably an access denied if you try to run from the file:// context
            // Loading the hard coded error level to have at least something to play with
            this.LoadThisTextLevel(hardcodedErrorTextLevel);
        }
    };
    // Callback method for the onreadystatechange event of XMLHttpRequest
    Game.prototype.OnLevelReady = function (eventResult) {
        var newTextLevel = "";

        if (eventResult.readyState == 4) {
            // If everything was OK
            if (eventResult.status == 200)
                newTextLevel = eventResult.responseText.replace(/[\n\r\t]/g, '');
            else {
                // Loading a hard coded level in case of error
                newTextLevel = hardcodedErrorTextLevel;
            }

            this.LoadThisTextLevel(newTextLevel);
        }
    };

    Game.prototype.LoadThisTextLevel = function (textLevel) {
        this.HideStatusCanvas();
        scoreText = null;

        // Unloads the content for the current level before loading the next one.
        if (this.level != null)
            this.level.Dispose();

        this.level = new Level(this.GameStage, this.GameContentManager, textLevel, this.gameWidth, this.gameHeight);
        this.level.StartLevel();
    };

    // Loaded if the hero lost because of a timeout
    Game.prototype.ReloadCurrentLevel = function () {
        --this.levelIndex;
        this.LoadNextLevel();
    }

    Game.prototype.handleKeyDown = function (e) {
        //cross browser issues exist
        if (!e) { var e = window.event; }
    switch (e.keyCode) {
        case KEYCODE_A: ;
        case KEYCODE_LEFT:
            // We're launching the walk_left animation
            if (this.level.Luke.alive && this.level.Luke.isInIdleMode) {
                this.level.Luke.gotoAndPlay("move_left");
                this.level.Luke.direction = -1;
                this.level.Luke.isInIdleMode = false;
            }
            break;
        case KEYCODE_D: ;
        case KEYCODE_RIGHT:
            // We're launching the walk_right animation
            if (this.level.Luke.alive && this.level.Luke.isInIdleMode) {
                this.level.Luke.gotoAndPlay("move_right");
                this.level.Luke.direction = 1;
                this.level.Luke.isInIdleMode = false;
            }
            break;
        case KEYCODE_S: ;
        case KEYCODE_UP:
            // We're launching the walk_right animation
            if (this.level.Luke.alive && this.level.Luke.isInIdleMode) {
                this.level.Luke.gotoAndPlay("move_up");
                this.level.Luke.direction = 2;
                this.level.Luke.isInIdleMode = false;
            }
            break;
        case KEYCODE_DOWN:
            // We're launching the walk_right animation
            if (this.level.Luke.alive && this.level.Luke.isInIdleMode) {
                this.level.Luke.gotoAndPlay("move_down");
                this.level.Luke.direction = -2;
                this.level.Luke.isInIdleMode = false;
                this.level.Luke.isJumping = true;
            }
            break;
        }
    };

    Game.prototype.handleKeyUp = function (e) {
        //cross browser issues exist
        if (!e) { var e = window.event; }
        switch (e.keyCode) {
            case KEYCODE_A: ;
            case KEYCODE_LEFT: ;
            case KEYCODE_D: ;
            case KEYCODE_UP: ;
            case KEYCODE_DOWN: ;
            case KEYCODE_S: ;
            case KEYCODE_RIGHT:
                if ( this.level.Luke.alive) {
                     this.level.Luke.direction = 0;
                     this.level.Luke.isInIdleMode = true;
                     this.level.Luke.gotoAndPlay("idle");
                }
                break;
        }
    };

    window.Game = Game;
} (window));