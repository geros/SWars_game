//-----------------------------------------------------------------------------
// Lightsaber.js
//
// Inspired by the Microsoft XNA Community Game Platformer Sample
// Copyright (C) Microsoft Corporation. All rights reserved.
// Ported to HTML5 Canvas with EaselJS by David Rousset - http://blogs.msdn.com/davrous
//-----------------------------------------------------------------------------

/// <summary>
/// A valuable item the player can collect.
/// </summary>
(function (window) {
    var localBounds;

    // Bounce control constants
    var BounceHeight = 0.18;
    var BounceRate = 3.0;
    var BounceSync = -0.75;

    function Lightsaber(texture, level, position) {
        this.initialize(texture, level, position);
    }
    Lightsaber.prototype = new createjs.Bitmap();

    // constructor:
    //unique to avoid overiding base class
    Lightsaber.prototype.Bitmap_initialize = Lightsaber.prototype.initialize;

    Lightsaber.prototype.initialize = function (texture, level, position) {
        var width;
        var left;
        var height;
        var top;
        var frameWidth;
        var frameHeight;

        this.Bitmap_initialize(texture);
        this.level = level;

        this.x = position.x * 40 +32 ;
        this.y = position.y * 32 + 32 ;

        if (enableShadows)
            this.shadow = new createjs.Shadow("#000", 3, 2, 2);

        // The gem is animated from a base position along the Y axis.
        this.basePosition = new createjs.Point(this.x, this.y);

        frameWidth = texture.width;
        frameHeight = texture.height;


        width = frameWidth * 1;
        left = frameWidth / 1;
        height = frameWidth * 1;
        top = frameHeight - height;
        localBounds = new XNARectangle(left, top, width, height);
    };

    Lightsaber.prototype.PointValue = 30;

    /// <summary>
    /// Bounces up and down in the air to entice players to collect them.
    /// </summary>
    Lightsaber.prototype.BoundingRectangle = function () {
        var left = Math.round(this.x -24) + localBounds.x;
        var top = Math.round(this.y -36 ) + localBounds.y ;
        return new XNARectangle(left, top, localBounds.width, localBounds.height);
    };

    /// <summary>
    /// Bounces up and down in the air to entice players to collect them.
    /// </summary>
    Lightsaber.prototype.tick = function () {
        // Bounce along a sine curve over time.
        // Include the X coordinate so that neighboring gems bounce in a nice wave pattern.
        var t = (createjs.Ticker.getTime() / 1000) * BounceRate + this.x * BounceSync;
        var bounce = Math.sin(t) * BounceHeight * 32;
        this.y = this.basePosition.y + bounce;
    };

    window.Lightsaber = Lightsaber;
} (window));