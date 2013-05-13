//-----------------------------------------------------------------------------
// Tile.js
//-----------------------------------------------------------------------------

/// <summary>
/// Controls the collision detection and response behavior of a tile.
/// </summary>
function Enum() { }

/// A passable tile is one which does not hinder player motion at all.
// Passable = 0,

/// An impassable tile is one which does not allow the player to move through
/// it at all. It is completely solid.
//  Impassable = 1,

/// A platform tile is one which behaves like a passable tile except when the
/// player is above it. A player can jump up through a platform as well as move
/// past it to the left and right, but can not fall down through the top of it.
// Platform = 2

Enum.TileCollision = { Passable: 0, Impassable: 1, Platform: 2 };

(function (window) {
    function Tile(texture, collision, x, y) {
        this.initialize(texture, collision,x,y);
    }
    Tile.prototype = new createjs.Bitmap();

      // constructor:
    Tile.prototype.Bitmap_initialize = Tile.prototype.initialize; //unique to avoid overiding base class

    Tile.prototype.initialize = function(texture, collision, x, y) {
        if (texture != null) {
            this.Bitmap_initialize(texture);
            this.empty = false;
        }
        else {
            this.empty = true;
        }
        this.Collision = collision;
        this.x = x * this.Width;
        this.y = y * this.Height;
    };

    Tile.prototype.Width = 46;
    Tile.prototype.Height = 46;

    window.Tile = Tile;
} (window));