/********************************************************************\
Project: Swarm
File: Noninteracting.js
Description: object used to create hold and delete non interacting objects
Author: Turner Bohlen (www.turnerbohlen.com)
Created: 01/10/2013
Copyright 2013 Turner Bohlen
\********************************************************************/

/*
 * Function: Noninteracting
 * Creates a new noninteracting container.
 */
function Noninteracting() {
    this.particles = {};
    this.lastIndex = -1;
    this.logicIndex = -1;
    this.drawIndex = -1;
}

/*
 * Method: addFlash
 *
 * Member Of: Noninteracting
 */
Noninteracting.prototype.addFlash = function(x, y, color, type) {
    var flash;
    if (type === "fast") {
        flash = new FastFlash(x, y, color);
    }
    else {
        flash = new Flash(x, y, color);
    }
    this.lastIndex++;
    this.particles[this.lastIndex] = flash;
};

/*
 * Method: doLogic
 *
 * Parameters:
 * game - the game object.
 *
 * Member Of: Noninteracting
 */
Noninteracting.prototype.doLogic = function(game) {
    var key;
    for (key in this.particles) {
        var particle = this.particles[key];
        if (particle.isDead(this)) {
            delete this.particles[key];
        }
    }
};

/*
 * Method: draw
 * Draws the particle system. This function can be replaced easily for
 * individual particle systems.
 *
 * Parameters:
 * ctx - the context to draw on.
 *
 * Member Of: Noninteracting
 */
Noninteracting.prototype.draw = function(game) {
    var key;
    for (key in this.particles) {
        var particle = this.particles[key];
        this.particles[key].draw(game);
    }
};


///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Flash Object /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/*
 * Constructor: Flash
 * Object that displays a brief flash on the screen.
 */
function Flash(x, y, color) {
    this.pos = new THREE.Vector2(x, y);
    this.draws = 0;
    this.maxDraws = 20;
    this.radius = 8;
    this.color = color;
}

/*
 * Method: isDead
 * Returns true if this particle is dead and should be removed from the game.
 *
 * Parameters:
 * game - the game object for easy reference to other objects
 *
 * Member Of: Flash
 */
Flash.prototype.isDead = function(game) {
    return this.draws >= this.maxDraws;
};

/*
 * Method: getRadius
 * Returns the radius that the flash should have given its maxDraws and draws.
 *
 * Member Of: Flash
 */
Flash.prototype.getRadius = function() {
    return (1 - Math.pow(this.draws/this.maxDraws - 0.2, 3)) * this.radius;
};

/*
 * Method: draw
 * Draws the flash to the screen
 *
 * Parameters:
 * game - the game object for easy reverences to other objects
 *
 * Member Of: Flash
 */
Flash.prototype.draw = function(game) {
    var radius = this.getRadius();
    game.context.fillStyle = getColorString(this.color);
    drawCircle(this.pos.x, this.pos.y, radius, game.context);
    game.context.fill();
    this.draws++;
};



/*
 * Constructor: FastFlash
 * Object that displays a brief flash on the screen.
 */
function FastFlash(x, y, color) {
    Flash.call(this, x, y, color);
    this.maxDraws = 5;
    this.radius = 20;
}

inherits(FastFlash, Flash);

/*
 * Method: getRadius
 * Returns the radius that the flash should have given its maxDraws and draws.
 *
 * Member Of: Flash
 */
Flash.prototype.getRadius = function() {
    return (1 - Math.pow(this.draws/this.maxDraws - 0.4, 1)) * this.radius;
};
