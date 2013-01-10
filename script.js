var drawLoopID;
var logicLoopID;
var LOGIC_LOOP_TIME = 5;
var DRAW_LOOP_TIME = 1000/30;
var PLAYER_VEL = 1.5



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
    this.drawElements = {};
    this.logicElements = {};
    this.lastDrawIndex = -1;
    this.lastLogicIndex = -1;
    this.drawFrame = 0;
    this.logicFrame = 0;
    this.noninteracting = new Noninteracting();
    this.addSprite(this.noninteracting, true, true);
}

/*
 * Method: addSprite
 * Adds an object to the drawElements and logicElements, or just one of the two
 * lists.
 *
 * Parameters:
 * sprite - the object to add to the lists
 * draw - true if should be added to drawElements
 * logic - true if should be added to logicElements
 *
 * Member Of: Game
 */
Game.prototype.addSprite = function(sprite, draw, logic) {
    if (draw) {
        this.lastDrawIndex++;
        this.drawElements[this.lastDrawIndex] = sprite;
        sprite.drawIndex = this.lastDrawIndex;
    }
    if (logic) {
        this.lastLogicIndex++;
        this.logicElements[this.lastLogicIndex] = sprite;
        sprite.logicIndex = this.lastLogicIndex;
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
 * Constructor: Player
 * Builds a new player object that can be moved around and displayed on
 * screen.
 *
 * Parameters:
 * x - the x coord of the player
 * y - the y coord of the player
 * num - the number of particles to start with
 */
function Player(x, y, number, color) {
    this.unused = true;
    this.age = 0;
    this.x = x;
    this.y = y;
    this.drawIndex = -1;
    this.logicIndex = -1;
    this.color = color;
    this.system = new PlayerSystem(this.x, this.y, number, color);
    this.radius = 10;
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
    game.addSprite(this, true, true);
    game.addSprite(this.system, true, true);
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
    drawCircle(this.x, this.y, this.radius, game.context);
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
    if(this.left && this.x >= 0) {
        dir.x -= 1;
    }
    if (this.right && this.x <= game.width) {
        dir.x += 1;
    }
    if (this.down && this.y <= game.height) {
        dir.y += 1;
    }
    if (this.up && this.y >= 0) {
        dir.y -= 1;
    }
    dir.setLength(PLAYER_VEL);
    this.system.y += dir.y;
    this.system.x += dir.x;
    this.y += dir.y;
    this.x += dir.x;
};



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
    for (var key in game.drawElements) {
        if (game.drawElements.hasOwnProperty(key)) {
            var element = game.drawElements[key];
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
    // update all important variables
    logicUpdate(game);

    // run all logicElements
    for (var key in game.logicElements) {
        if (game.logicElements.hasOwnProperty(key)) {
            game.logicElements[key].doLogic(game);
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
        game.playerOne = new Player(400, 200, 100, [200, 0, 0]);
        game.playerTwo = new Player(1000, 200, 100, [0, 200, 0]);

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
