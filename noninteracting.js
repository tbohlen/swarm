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
Noninteracting.prototype.addFlash = function(pos, color, type) {
    var flash;
    if (type === "fast") {
        flash = new FastFlash(pos, color);
    }
    else {
        flash = new Flash(pos, color);
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

/*
 * Method: isDead
 * Returns true if the noninteracting object should be removed from the game.
 *
 * Member Of: Noninteracting
 */
Noninteracting.prototype.isDead = function() {
    return false;
};

/*
 * Method: die
 * Does nothing
 *
 * Member Of: Noninteracting
 */
Noninteracting.prototype.die = function() {
    // do nothing
};


///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Flash Object /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/*
 * Constructor: Flash
 * Object that displays a brief flash on the screen.
 */
function Flash(pos, color) {
    this.pos = pos;
    this.draws = 0;
    this.maxDraws = 20;
    this.radius = 10;
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
    game.context.fillStyle = getColorString(this.color, 1.0, 1 - this.draws/this.maxDraws);
    drawCircle(this.pos, radius, game.context);
    game.context.fill();
    this.draws++;
};



/*
 * Constructor: FastFlash
 * Object that displays a brief flash on the screen.
 */
function FastFlash(pos, color) {
    Flash.call(this, pos, color);
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
FastFlash.prototype.getRadius = function() {
    return (1 - Math.pow(this.draws/this.maxDraws - 0.4, 1)) * this.radius;
};
