var drawLoopID;
var logicLoopID;
var LOGIC_LOOP_TIME = 8;
var DRAW_LOOP_TIME = 1000/30;
var colors = [[255, 100, 100], [75, 255, 125], [100, 100, 200], [175, 175, 50]]



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

    this.nextLevelIndex = 0
}

/*
 * Method: nextLevel
 * Starts the next level.
 *
 * Member Of: Game
 */
Game.prototype.nextLevel = function() {
    if  (this.nextLevelIndex) {
        this.currentLevel.kill(this);
    }
    this.context.fillStyle = "rgb(255, 255, 255)";
    this.context.font = "40px helvetica";

    if(window.gameLevels.length > this.nextLevelIndex) {
        var coords = getTextXY("Next Universe!", this.context);
        this.context.fillText("Next Universe!", coords[0], coords[1]);

        this.currentLevel = new window.gameLevels[this.nextLevelIndex]();
        this.addSprite(this.currentLevel, false, true);
        this.nextLevelIndex++;
    }
    else {
        var coords = getTextXY("Winner!", this.context);
        this.context.fillText("Winner!", coords[0], coords[1]);
    }
};

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
///////////////////////////////// Blackhole ///////////////////////////////////
///////////////////////////////////////////////////////////////////////////////



/*
 * Constructor: Blackhole
 * Builds a new blackhole object that can be moved around and displayed on
 * screen.
 *
 * Parameters:
 * x - the x coord of the center
 * y - the y coord of the center of the blackhole
 * radius - the radius of the collision area of the blackhole
 */
function Blackhole(x, y, radius) {
    this.unused = true;
    this.age = 0;
    this.centerX = x;
    this.centerY = y;
    this.radius = radius;
    this.height = radius;
    this.width = radius;
    this.x = this.centerX - this.radius/2
    this.y = this.centerY - this.radius/2;
    this.drawIndex = -1;
    this.logicIndex = -1;
    this.maxAge = 8;
    this.system = new BlackholeSystem(this.centerX, this.centerY, this.radius, this.maxAge);
}

/*
 * Method: show
 * shows the blackhole by adding it to the games logic and draw lists.
 *
 * Parameters:
 * game - the game object
 *
 * Member Of: Blackhole
 */
Blackhole.prototype.show = function(game) {
    game.addSprite(this.system, true, true);
    game.addSprite(this, true, true);
};

/*
 * Method: draw
 * Draws the blackhole on the screen.
 *
 * Parameters:
 * ctx - the drawing context
 *
 * Member Of: Blackhole
 */
Blackhole.prototype.draw = function(game) {
    game.context.fillStyle = "rgb(0,0,0)";
    drawCircle(this.centerX, this.centerY, this.radius, game.context);
    game.context.fill();
    this.age++;
};

/*
 * Method: contains
 * returns true if x, y is a point inside the blackhole shape.
 *
 * Parameters:
 * x - the x position to test
 * y - the y position to test
 *
 * Member Of: Blackhole
 */
Blackhole.prototype.contains = function(x, y) {
    return distance(this.centerX, this.centerY, x, y) <= this.radius;
};

/*
 * Method: doLogic
 * Runs the logic associated with the blackhole.
 *
 * Parameters:
 * game - the game object
 *
 * Member Of: Blackhole
 */
Blackhole.prototype.doLogic = function(game) {
    if (this.contains(game.mouseX, game.mouseY) && this.unused) {
        // if the mouse is within the shape and the blackhole is alive, go to
        // the next level
        game.nextLevel();
        this.unused = false;
    }
};

/*
 * Method: kill
 * Kills the object by removing it from the drawElements list and setting alive to
 * false.
 *
 * Parameters:
 * Param - desc...
 *
 * Member Of: Blackhole
 */
Blackhole.prototype.isDead = function(game) {
    return this.age > this.maxAge && Object.keys(this.system.particles).length == 0;
};

/*
 * Method: kill
 * Cleans up the blackhole as it is killed.
 *
 * Parameters:
 * game - the game obj
 *
 * Member Of: Blackhole
 */
Blackhole.prototype.kill = function(game) {
    this.system.dead = true;
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
            if (element.isDead()) {
                element.kill();
                delete game.drawElements[element.drawIndex];
                delete game.logicElements[element.logicIndex];
            }
            else {
                element.draw(game);
            }
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
    window.game.blackholeImage = new Image();
    console.log("Loading...");
    window.game.blackholeImage.onload = function() {
        callback(window.game);
    };
    window.game.blackholeImage.src = "images/blackhole.png";
}


$(document).ready(function() {

    // load the game. This should be used to show a loading bar in future.
    loadGame(function(game) {
        console.log("loaded");
        // size the game and add the canvas to the screen
        game.resize();
        game.nextLevel();

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

        $(document).on('keypress', function(ev) {
            // pressing 1 allows for level skipping
            if (ev.keycode === 49) {
                window.game.nextLevel();
            }
        })
    });
});
