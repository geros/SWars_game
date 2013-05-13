
//-----------------------------------------------------------------------------
// ContentManager.js
//-----------------------------------------------------------------------------

// Used to download all needed resources from our
// webserver
function ContentManager(stage, width, height) {
    // Method called back once all elements
    // have been downloaded
    var ondownloadcompleted;
    // Number of elements to download
    var NUM_ELEMENTS_TO_DOWNLOAD = 10;
    var numElementsLoaded = 0;


    var downloadProgress;

    // Need to check the canPlayType first or an exception
    // will be thrown for those browsers that don't support it
    var myAudio = document.createElement('audio');


    if (myAudio.canPlayType) {
        // Currently canPlayType(type) returns: "", "maybe" or "probably"
        canPlayMp3 = !!myAudio.canPlayType && "" != myAudio.canPlayType('audio/mpeg');
        canPlayOgg = !!myAudio.canPlayType && "" != myAudio.canPlayType('audio/ogg; codecs="vorbis"');
    }

    // setting the callback method
    // Triggered once everything is ready to be drawned on the canvas
    this.SetDownloadCompleted = function (callbackMethod) {
        ondownloadcompleted = callbackMethod;
    };

     // We have 4 type of enemies, 1 hero & 1 type of tile
    this.imgLuke = new Image();
    this.imgLightsaber = new Image();
    this.imgDarth = new Image();
    this.winOverlay = new Image();
    this.loseOverlay = new Image();
    this.imgGroundTile = new Image();
    this.imgBlockA0 = new Image();
    this.imgEarth = new Image();
    this.imgMoon = new Image();
    this.diedOverlay = new Image();
    this.imgBlank = new Image();
    this.playerKilled = new Audio();
    this.exitReached = new Audio();

    this.gemCollected = [];

    // the background can be created with 3 differents layers
    // those 3 layers exist in 3 versions
    this.imgBackgroundLayers = new Array();

    // public method to launch the download process
    this.StartDownload = function () {

        downloadProgress = new createjs.Text("-- %", "bold 14px Arial", "#FFF");
        downloadProgress.x = (screen_width / 2) - 50;
        downloadProgress.y = screen_height / 2;
        stage.addChild(downloadProgress);

        var audioExtension = ".none";


        if (canPlayOgg) {
            audioExtension = ".ogg";
        }
        else if (canPlayMp3){
            audioExtension = ".mp3";
        }

        if (audioExtension !== ".none") {
            SetAudioDownloadParameters(this.playerKilled, "./assets/sounds/nooo" + audioExtension);
            SetAudioDownloadParameters(this.exitReached, "./assets/sounds/Rebel" + audioExtension);
            for (var a = 0; a < 1; a++) {
                    this.gemCollected[a] = new Audio();
                    SetAudioDownloadParameters(this.gemCollected[a], "./assets/sounds/clash" + audioExtension);
                }
        }

        SetDownloadParameters(this.imgLuke, "./assets/luke.png");
        SetDownloadParameters(this.imgLightsaber, "./assets/lightsabericongreen.png");
        SetDownloadParameters(this.imgDarth, "./assets/darthvader.png");
        SetDownloadParameters(this.imgBlockA0, "./assets/BlockA0.png");
        SetDownloadParameters(this.imgEarth, "./assets/Earth.png");
        SetDownloadParameters(this.imgMoon, "./assets/Moon.png");
        SetDownloadParameters(this.imgBlank, "./assets/blank.png");
        SetDownloadParameters(this.winOverlay, "./assets/overlays/win.png");
        SetDownloadParameters(this.loseOverlay, "./assets/overlays/lose.png");
        SetDownloadParameters(this.diedOverlay, "./assets/overlays/darth-noooo.png");


        createjs.Ticker.addListener(this);
        createjs.Ticker.setInterval(50);
    };

    function SetDownloadParameters(assetElement, url) {
        assetElement.src = url;
        assetElement.onload = handleElementLoad;
        assetElement.onerror = handleElementError;
    };

    function SetAudioDownloadParameters(assetElement, url) {
        assetElement.src = url;
        // Precharging the sound
        assetElement.load();
    };

    // our global handler
    function handleElementLoad(e) {
        numElementsLoaded++;

        // If all elements have been downloaded
        if (numElementsLoaded === NUM_ELEMENTS_TO_DOWNLOAD) {
            stage.removeChild(downloadProgress);
            createjs.Ticker.removeAllListeners();
            numElementsLoaded = 0;
            // we're calling back the method set by SetDownloadCompleted
            ondownloadcompleted();
        }
    }

    //called if there is an error loading the image (usually due to a 404)
    function handleElementError(e) {
        console.log("Error Loading Asset : " + e.target.src);
    }

    // Update methid which simply shows the current % of download
    this.tick = function() {
        downloadProgress.text = "Downloading " + Math.round((numElementsLoaded / NUM_ELEMENTS_TO_DOWNLOAD) * 100) + " %";

        // update the stage:
        stage.update();
    };
}

