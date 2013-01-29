/*
 * Order of events:
 *
 * Cleanup of dead sprites
 * Collisions
 * Logic
 */
var drawLoopID;
var logicLoopID;
var LOGIC_LOOP_TIME = 5;
var DRAW_LOOP_TIME = 1000/30;
var PLAYER_VEL = 0.5;
var LIFE_VELOCITY_BUFFER = 5;
var STARTING_LIVES = 10;
var RADIUS = 2
var PLAYER_RADIUS = 7;
var ATTACK_DISTANCE = 40;
var ATTACK_THRUSTERS = 8;
var THRUSTERS = 8;
var MAX_SPEED = 5;
var CONNECT_DIST = 100;
var ATTACK_DELAY = 20;
var ATTACH_DISTANCE = 200;
var TIME_STEP = 0.1;
var COLLISION_EPSILON = 0.1;


///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Game Object //////////////////////////////////
///////////////////////////////////////////////////////////////////////////////



/*
 * Constructor: Game
 * Constructs a new game object.
 */
function Game() {
    var offset;
    // find everything, set variables
    this.canvas = $("#game")
    this.context = this.canvas[0].getContext("2d")
    this.width = this.canvas.width();
    this.height = this.canvas.height();
    this.elements = {};
    this.lastIndex = -1;
    this.drawFrame = 0;
    this.logicFrame = 0;
    this.noninteracting = new Noninteracting();
    this.addSprite(this.noninteracting, false);
    this.collidables = {};
    this.lastCollideIndex = -1;
}

/*
 * Method: addSprite
 * Adds an object to the elements list, and, if it is collidable, to the
 * collidables list, too.
 *
 * Parameters:
 * sprite - the object to add to the lists
 * collides - true if the sprite collides with other particles
 *
 * Member Of: Game
 */
Game.prototype.addSprite = function(sprite, collide) {
    this.lastIndex++;
    this.elements[this.lastIndex] = sprite;
    sprite.gameIndex = this.lastIndex; 

    if (collide) {
        this.lastCollideIndex++;
        this.collidables[this.lastCollideIndex] = sprite;
        sprite.collideIndex = this.lastCollideIndex;
    }
};

/*
 * Method: removeSprite
 * removes the given sprite from the game
 *
 * Parameters:
 * sprite - the object to remove from the game
 *
 * Member Of: Game
 */
Game.prototype.removeSprite = function(sprite) {
    sprite.die();
    if (sprite.collideIndex !== 'undefined' && typeof(sprite.collideIndex) !== null) {
        delete this.collidables[sprite.collideIndex];
    }
    if (sprite.gameIndex !== 'undefined' && typeof(sprite.gameIndex) !== null) {
        delete this.elements[sprite.gameIndex]
    }
};

/*
 * Method: resize
 * Resizes the game to fill the entire screen
 *
 * Member Of: Game
 */
Game.prototype.resize = function() {
    this.canvas.height($(window).innerHeight());
    this.canvas.width($(window).innerWidth());
    this.height = this.canvas.height();
    this.width = this.canvas.width();
    this.canvas.attr("height", this.height);
    this.canvas.attr("width", this.width);
    offset = this.canvas.offset();
    this.offsetX = offset.left;
    this.offsetY = offset.top;
};



///////////////////////////////////////////////////////////////////////////////
////////////////////////////////// Player /////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////



/*
 * Constructor: ParticleSource
 * Creates an area near which new particles are created.
 */
function ParticleSource(x, y) {
    this.pos = new THREE.Vector2(x, y);
}



///////////////////////////////////////////////////////////////////////////////
////////////////////////////////// Player /////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////



/*
 * Constructor: Player
 * Builds a new player object that can be moved around and displayed on
 * screen.
 *
 * Parameters:
 * x - the x coord of the player
 * y - the y coord of the player
 * num - the number of particles to start with
 */
function Player(x, y, number, color, team) {
    this.unused = true;
    this.age = 0;
    this.pos = new THREE.Vector2(x, y);
    this.vel = new THREE.Vector2(0, 0);
    this.drawIndex = -1;
    this.logicIndex = -1;
    this.color = color;
    this.team = team
    this.system = new PlayerSystem(this.pos, number, color, this.team);
    this.radius = PLAYER_RADIUS;
}

/*
 * Method: show
 * shows the blackhole by adding it to the games logic and draw lists.
 *
 * Parameters:
 * game - the game object
 *
 * Member Of: Player
 */
Player.prototype.show = function(game) {
    game.addSprite(this, false);
    game.addSprite(this.system, false);
};

/*
 * Method: draw
 * Draws the blackhole on the screen.
 *
 * Parameters:
 * ctx - the drawing context
 *
 * Member Of: Player
 */
Player.prototype.draw = function(game) {
    game.context.fillStyle = "rgb(" + Math.floor(this.color[0]).toString() + ", " + Math.floor(this.color[1]).toString() + ", " + Math.floor(this.color[2]).toString() + ")";
    drawCircle(this.pos, this.radius, game.context);
    game.context.fill();
    this.age++;
};

/*
 * Method: doLogic
 * Runs the logic associated with the blackhole.
 *
 * Parameters:
 * game - the game object
 *
 * Member Of: Player
 */
Player.prototype.doLogic = function(game) {
    var dir = new THREE.Vector2(0, 0);
    if(this.left && this.pos.x >= 0) {
        dir.x -= 1;
    }
    if (this.right && this.pos.x <= game.width) {
        dir.x += 1;
    }
    if (this.down && this.pos.y <= game.height) {
        dir.y += 1;
    }
    if (this.up && this.pos.y >= 0) {
        dir.y -= 1;
    }
    dir.setLength(PLAYER_VEL);
    this.system.pos.addSelf(dir);
    this.pos.y += dir.y;
    this.pos.x += dir.x;
};

/*
 * Method: isDead
 * Returns true if this particle is dead and can be removed from the game.
 *
 * Member Of: Player
 */
Player.prototype.isDead = function() {
    return false;
};

/*
 * Method: die
 * Does nothing.
 *
 * Member Of: Player
 */
Player.prototype.die = function() {
    // do nothing
};



///////////////////////////////////////////////////////////////////////////////
///////////////////////////// Main Drawing Loop ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////


/*
 * Constructor: target
 * A location on the map that the particles are attracted to and can have some
 * effect on the particles.
 */
function target(x, y) {
    // body
}



///////////////////////////////////////////////////////////////////////////////
///////////////////////////// Main Drawing Loop ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////



/*
 * Function: drawUpdate
 * Updates all variables necessary to draw.
 */
function drawUpdate(game) {
    game.drawFrame++;
}

/*
 * Function: logicUpdate
 * Updates all the necessary variables for the logic run.
 */
function logicUpdate(game) {
    game.logicFrame++;
}

/*
 * Function: clearScreen
 * Clears the drawing context entirely.
 *
 * Parameters:
 * color - the color to make the screen.
 */
var clearScreen = function(game, color) {
    game.context.clearRect(0, 0, game.width, game.height);
    if (color !== null && typeof(color) !== 'undefined') {
        game.context.fillStyle = color;
        game.context.fillRect(0, 0, game.width, game.height);
    }
};

/*
 * Function: drawLoop
 * Draws the game. And keeps the drawFrame up to date. The logic is handled
 * elsewhere.
 */
function drawLoop(game) {
    var i;
    // update all important variables
    drawUpdate(game);
    // clean the screen
    clearScreen(game, "rgb(0, 0, 0)");

    // draw all drawElements or kill them if they are dead
    for (var key in game.elements) {
        if (game.elements.hasOwnProperty(key)) {
            var element = game.elements[key];
            element.draw(game);
        }
    }
}

/*
 * Function: logicLoop
 * Executes the logic of the game, one logicElement at a time.
 */
function logicLoop(game) {
    var i;
    var key;
    // update all important variables
    logicUpdate(game);

    // check to see if any sprites are dead and if the are, remove them
    for (key in game.elements) {
        var elem = game.elements[key];
        if (elem.isDead()) {
            game.removeSprite(elem)
        }
    }

    // run all collision detections
    var collidables = [];
    for (var key in game.collidables) {
        if (game.collidables.hasOwnProperty(key)) {
            // clear the distances stored in the particle
            game.collidables[key].distances = [];
        }
    }
    for (var key in game.collidables) {
        if (game.collidables.hasOwnProperty(key)) {
            var one = game.collidables[key];
            // test it against all already in collidables
            for (i = 0; i < collidables.length; i++) {
                var two = collidables[i];
                var totRadius = two.radius + one.radius;
                var totDistance = one.pos.distanceTo(two.pos);

                two.distances.push([one.collideIndex, totDistance]);
                one.distances.push([two.collideIndex, totDistance]);

                // check for collisions
                if (totDistance < totRadius + COLLISION_EPSILON) {
                    // run the resolve collision function on the two ones
                    resolveCollision(one, two)
                    // run custom resolutions
                    if (one.team !== two.team) {
                        one.lives--;
                        two.lives--;
                    }
                }
            }

            // append it to the collidables list so that future collisions tests
            // include it
            collidables.push(one);
        }
    }

    // run all logicElements
    for (var key in game.elements) {
        if (game.elements.hasOwnProperty(key)) {
            game.elements[key].doLogic(game);
        }
    }
}

/*
 * Function: loadGame
 * Loads the game, including necesary images, waiting until they are all loaded
 * to continue.
 */
function loadGame(callback) {
    window.game = new Game();
    callback(window.game);
}


$(document).ready(function() {

    // load the game. This should be used to show a loading bar in future.
    loadGame(function(game) {
        console.log("loaded");
        // size the game and add the canvas to the screen
        game.resize();

        // create the players
        game.playerOne = new Player(400, 200, 50, [100, 100, 255], 1);
        game.playerTwo = new Player(1000, 200, 50, [80, 255, 80], 2);

        // give each system a reference to the other
        game.playerOne.system.others = game.playerTwo.system.particles;
        game.playerTwo.system.others = game.playerOne.system.particles;

        // show both players
        game.playerOne.show(game);
        game.playerTwo.show(game);


        // start the loops
        drawLoopId = window.setInterval(drawLoop, DRAW_LOOP_TIME, game);
        logicLoopID = window.setInterval(logicLoop, LOGIC_LOOP_TIME, game); // 200 times per second

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////////// Event Handlers //////////////////////////////
        ///////////////////////////////////////////////////////////////////////////

        $(document).on('mousemove', function(ev) {
            // when the mouse is moved, update the position
            game.mouseX = ev.pageX - game.offsetX;
            game.mouseY = ev.pageY - game.offsetY;
        });

        $(document).on('keydown', function(ev) {
            // Player one up, left, right, down for moving
            if (ev.keyCode === 37) {
                // move left
                window.game.playerOne.left = true;
            }
            if (ev.keyCode === 38) {
                // move up
                window.game.playerOne.up = true;
            }
            if (ev.keyCode === 39) {
                // move right
                window.game.playerOne.right = true;
            }
            if (ev.keyCode === 40) {
                // move down
                window.game.playerOne.down = true;
            }

            // player two w a s d for moving
            if (ev.keyCode === 65) {
                // move left
                window.game.playerTwo.left = true;
            }
            if (ev.keyCode === 87) {
                // move up
                window.game.playerTwo.up = true;
            }
            if (ev.keyCode === 68) {
                // move right
                window.game.playerTwo.right = true;
            }
            if (ev.keyCode === 83) {
                // move down
                window.game.playerTwo.down = true;
            }
        });

        $(document).on('keyup', function(ev) {
            // up, left, right, down for moving
            if (ev.keyCode === 37) {
                // move left
                window.game.playerOne.left = false;
            }
            if (ev.keyCode === 38) {
                // move up
                window.game.playerOne.up = false;
            }
            if (ev.keyCode === 39) {
                // move right
                window.game.playerOne.right = false;
            }
            if (ev.keyCode === 40) {
                // move down
                window.game.playerOne.down = false;
            }

            // player two w a s d for moving
            if (ev.keyCode === 65) {
                // move left
                window.game.playerTwo.left = false;
            }
            if (ev.keyCode === 87) {
                // move up
                window.game.playerTwo.up = false;
            }
            if (ev.keyCode === 68) {
                // move right
                window.game.playerTwo.right = false;
            }
            if (ev.keyCode === 83) {
                // move down
                window.game.playerTwo.down = false;
            }
        });
    });
});
