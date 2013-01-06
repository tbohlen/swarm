///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Time Stepper /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


/*
 * Function: eulerStep
 * executes a single forward Euler integration step of size timeStep on the
 * provided particle system.
 */
function eulerStep(system, timeStep) {
    var currentState = system.getState();
    var deriv = system.evalDeriv(currentState);
    var key;
    for (key in currentState) {
        var particle = currentState[key];

        currentState[key] = addVectors(particle, scale(deriv[key], timeStep));

    }
    system.setState(currentState);
}

/*
 * Function: trapezoidalStep
 * Executes a single trapezoidal integration step forward of size timeStep.
 */
function trapezoidalStep(system, timeStep) {
    // find the next state, given a full euler step
    var currentState = system.getState();
    var deriv = system.evalDeriv(currentState);
    var nextState = {};
    var key;
    for (key in currentState) {
        var particle = currentState[key];

        nextState[key] = addVectors(particle, scale(deriv[key], timeStep));
    }

    // find the derivative at this next state
    var nextDeriv = system.evalDeriv(nextState);

    // use the two derivatives to find a better approximate state
    for (key in currentState) {
        var particle = currentState[key];

        currentState[key] = addVectors(particle, scale(addVectors(deriv[key], nextDeriv[key]), timeStep/2));
    }

    system.setState(currentState);
}



///////////////////////////////////////////////////////////////////////////////
////////////////////////////// ParticleSystem /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////



/*
 * Constructor: ParticleSystem
 * Builds a particle system without any particles. Those must be added through
 * the addParticles method.
 * 
 * The system stores state as a vector of vectors, where each vector represents
 * a particles x, y, velX, velY, and time.
 *
 * Parameters:
 * x - the x coord of the system
 * y - the y coord of the system
 */
function ParticleSystem(x, y) {
    this.x = x;
    this.y = y;
    this.particles = {};
    this.lastIndex = -1;
    this.dead = false;
    this.logicIndex = -1;
    this.drawIndex = -1;

    this.burstRadius = 100;
    this.particleVelocity = 4;
    this.emitRate = 2;
    this.maxParticleAge = this.burstRadius/this.particleVelocity;
}

/*
 * Method: addParticles
 * Adds new particles to the system. These particles' states are simply appended
 * to the existing state, so they must be formatted correctly (each state a
 * vector of x, y, velX, velY, and time).
 *
 * Parameters:
 * newStates - the states of the new particles to add to the particle system
 *
 * Member Of: ParticleSystem
 */
ParticleSystem.prototype.addParticles = function(newStates) {
    var i;
    var newNum = Math.floor(Math.random() * this.emitRate);
    for (i = 0; i < newNum; i++) {
        var angle = 2 * Math.PI * (i + Math.random() - 0.5) / newNum;
        var velX = this.particleVelocity * (Math.cos(angle) - 0.3 + Math.random() * 0.6);
        var velY = this.particleVelocity * (Math.sin(angle) - 0.3 + Math.random() * 0.6);
        var particle = new Particle(this.x, this.y, velX, velY);
        particle.maxAge = this.maxParticleAge;
        this.lastIndex++;
        this.particles[this.lastIndex] = particle;
    }
};

/*
 * Method: evalDeriv
 * Evaluates the derivative of the given system state. This does not use
 * "this.particles"! It uses whatever state is passed to it. Make sure to pass in a
 * state of the correct length. Incorrect behavior would certainly result if
 * you didn't.
 *
 * This particular implementation simply continues the motions of the particles
 * in a straight line with decreasing velocity.
 *
 * This function takes a state not a particle list.
 *
 * Parameters:
 * state - the state at which to calculate the force
 *
 * Member Of: ParticleSystem
 */
ParticleSystem.prototype.evalDeriv = function(state) {
    var key;
    var deriv = {};
    for (key in state) {
        var particle = state[key];
        deriv[key] = [particle[2], particle[3], 0, 0, 1];
    }
    return deriv;
};

/*
 * Method: getState
 * Returns a copy of the state of the particle system.
 *
 * Member Of: ParticleSystem
 */
ParticleSystem.prototype.getState = function() {
    var state = {};
    var key;
    for (key in this.particles) {
        state[key] = this.particles[key].state;
    }
    return state;
};

/*
 * Method: setState
 * Sets the state of each particle to the state mapped to the same key in the
 * newState array passed as an argument to this function.
 *
 * Parameters:
 * newState - the new state of the system.
 *
 * Member Of: ParticleSystem
 */
ParticleSystem.prototype.setState = function(newState) {
    var key;
    for (key in this.particles) {
        this.particles[key].state = newState[key];
    }
};

/*
 * Method: doLogic
 * Runs the logic of the system. Namely, emitting new particles and updating
 * the system.
 *
 * Parameters:
 * game - the game object.
 *
 * Member Of: ParticleSystem
 */
ParticleSystem.prototype.doLogic = function(game) {
    var key;
    for (key in this.particles) {
        var particle = this.particles[key];
        if (particle.isDead(this)) {
            delete this.particles[key];
        }
    }
    this.addParticles();
    // step forward the system
    trapezoidalStep(this, LOGIC_LOOP_TIME/DRAW_LOOP_TIME);
};

/*
 * Method: draw
 * Draws the particle system. This function can be replaced easily for
 * individual particle systems.
 *
 * Parameters:
 * ctx - the context to draw on.
 *
 * Member Of: ParticleSystem
 */
ParticleSystem.prototype.draw = function(game) {
    var key;
    for (key in this.particles) {
        var particle = this.particles[key];
        this.particles[key].draw(game);
    }
};

/*
 * Method: isDead
 * Checks to see if the particle system is dead and can be removed.
 *
 * Member Of: ParticleSystem
 */
ParticleSystem.prototype.isDead = function() {
    return this.dead;
};



///////////////////////////////////////////////////////////////////////////////
/////////////////////// Basic Particles (and sprite) //////////////////////////
///////////////////////////////////////////////////////////////////////////////



/*
 * Constructor: Particle
 * Builds a new generic particle.
 *
 * The particle must include all information the derivative evaluator in the
 * associated particle system might want in its state variable.
 *
 * Because there may be many of these particles, you most likely want to contain
 * any shared values in the prototype.
 */
function Particle(x, y, velX, velY) {
    this.state = [x, y, velX, velY, 0];
    this.maxAge = 10;
}

/*
 * Method: radius
 * Returns the radius of the particle
 *
 * Member Of: Particle
 */
Particle.prototype.radius = 4;

/*
 * Method: draw
 * Draws the particle.
 *
 * Parameters:
 * game - the game object.
 *
 * Member Of: Particle
 */
Particle.prototype.draw = function(game) {
    var scaleNum = 1.0 - (this.state[4]/this.maxAge);
    var color = scale([255.0, 255.0, 255.0], scaleNum);
    var radius = this.radius/scaleNum;
    game.context.fillStyle = "rgb(" + Math.floor(color[0]).toString() + ", " + Math.floor(color[1]).toString() + ", " + Math.floor(color[2]).toString() + ")";
    drawCircle(this.state[0], this.state[1], this.radius, game.context);
    game.context.fill();
};

/*
 * Method: isDead
 * Returns true if the particle is dead and false otherwise. Dead particles are
 * removed and never shown again. This particles dies if it is moved off screen
 * or older than its maxAge attribute.
 *
 * Member Of: Particle
 */
Particle.prototype.isDead = function(system) {
    return this.state[4] > this.maxAge ||
        this.state[0] < -75 || this.state[0] > window.game.width + 75 ||
        this.state[1] < -75 || this.state[1] > window.game.height + 75;
};



///////////////////////////////////////////////////////////////////////////////
////////////////////////////// ColorParticles /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////



/*
 * Constructor: ColorParticle
 * Builds a new color particle. It is essentially identical to the basic
 * particle, but it has a controllable color/
 */
function ColorParticle(x, y, velX, velY, color) {
    Particle.call(this, x, y, velX, velY);
    this.state = [x, y, velX, velY, 0];
    this.maxAge = 10;
    this.color = color;
}

inherits(ColorParticle, Particle);

/*
 * Method: radius
 * Returns the radius of the particle
 *
 * Member Of: Particle
 */
ColorParticle.prototype.radius = 4;

/*
 * Method: draw
 * Draws the particle.
 *
 * Parameters:
 * game - the game object.
 *
 * Member Of: Particle
 */
ColorParticle.prototype.draw = function(game) {
    var scaleNum = 1.5 - 1.5*Math.pow((this.state[4]/this.maxAge), 2);
    var color = scale(this.color, scaleNum);
    var radius = this.radius/scaleNum;
    game.context.fillStyle = "rgb(" + Math.floor(color[0]).toString() + ", " + Math.floor(color[1]).toString() + ", " + Math.floor(color[2]).toString() + ")";
    drawCircle(this.state[0], this.state[1], this.radius, game.context);
    game.context.fill();
};



///////////////////////////////////////////////////////////////////////////////
//////////////////////////// BlackholeParticles ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////



/*
 * Constructor: BlackholeParticle
 * Builds a new color particle. It is essentially identical to the basic
 * particle, but it has a controllable color/
 */
function BlackholeParticle(x, y, velX, velY, color, radius, blackholeRadius) {
    ColorParticle.call(this, x, y, velX, velY, color);
    this.state = [x, y, velX, velY, 0];
    this.maxAge = 10;
    this.color = color;
    this.blackholeRadius = blackholeRadius;
    this.radius = radius;
}

inherits(BlackholeParticle, Particle);

/*
 * Method: draw
 * Draws the particle.
 *
 * Parameters:
 * game - the game object.
 *
 * Member Of: BlackholeParticle
 */
BlackholeParticle.prototype.draw = function(game) {
    var scaleNum = 1.5 - 1.5*Math.pow((this.state[4]/this.maxAge), 2);
    var color = scale(this.color, scaleNum);
    var radius = this.radius/scaleNum;
    game.context.fillStyle = "rgb(" + Math.floor(color[0]).toString() + ", " + Math.floor(color[1]).toString() + ", " + Math.floor(color[2]).toString() + ")";
    drawCircle(this.state[0], this.state[1], this.radius, game.context);
    game.context.fill();
};

/*
 * Method: isDead
 * Returns true if the particle is dead and false otherwise. Dead particles are
 * removed and never shown again. This particles dies if it is moved off screen
 * or older than its maxAge attribute.
 *
 * Member Of: BlackholeParticle
 */
BlackholeParticle.prototype.isDead = function(system) {
    return this.state[4] > this.maxAge ||
        this.state[0] < -75 || this.state[0] > window.game.width + 75 ||
        this.state[1] < -75 || this.state[1] > window.game.height + 75 ||
        distance(this.state[0], this.state[1], system.x, system.y) < this.blackholeRadius;
};



///////////////////////////////////////////////////////////////////////////////
////////////////////////// Burst Particles System /////////////////////////////
///////////////////////////////////////////////////////////////////////////////



/*
 * Constructor: BurstSystem
 * A particle system where the particles simply fly straight out and continue
 * for quite a while.
 *
 * Parameters:
 * x - the x pos
 * y - the y pos
 * color - the color of the particles emitted
 */
function BurstSystem(x, y, color) {
    ParticleSystem.call(this, x, y)

    this.particleVelocity = 2;
    this.emitRate = 8;
    this.age = 0;
    this.color = color;
    this.maxEmittingAge = 10;
    this.maxParticleAge = 50;
    this.accel = -0.08;
    this.velVar = 0.1;
}

inherits(BurstSystem, ParticleSystem);

/*
 * Method: addParticles
 * Adds new particles to the system. These particles' states are simply appended
 * to the existing state, so they must be formatted correctly (each state a
 * vector of x, y, velX, velY, and time).
 *
 * Parameters:
 * newStates - the states of the new particles to add to the particle system
 *
 * Member Of: BurstSystem
 */
BurstSystem.prototype.addParticles = function(newStates) {
    
    var newNum = Math.floor(Math.random() * this.emitRate);
    for (i = 0; i < newNum; i++) {
        var angle = 2 * Math.PI * (i + Math.random() - 0.5) / newNum;
        var velX = this.particleVelocity * (Math.cos(angle) - this.velVar/2 + Math.random() * this.velVar);
        var velY = this.particleVelocity * (Math.sin(angle) - this.velVar/2 + Math.random() * this.velVar);
        var particle = new ColorParticle(this.x, this.y, velX, velY, scale(this.color, (1.0 -this.age/this.maxEmittingAge)));
        particle.maxAge = this.maxParticleAge;
        this.lastIndex++;
        this.particles[this.lastIndex] = particle;
    }
};

/*
 * Method: doLogic
 * Runs the logic of the system. Namely, emitting new particles and updating
 * the system.
 *
 * Parameters:
 * game - the game object.
 *
 * Member Of: BurstSystem
 */
BurstSystem.prototype.doLogic = function(game) {
    var key;
    for (key in this.particles) {
        var particle = this.particles[key];
        if (particle.isDead(this)) {
            delete this.particles[key];
        }
    }
    if (this.age < this.maxEmittingAge) {
        this.addParticles();
        // step forward the system
    }
    trapezoidalStep(this, LOGIC_LOOP_TIME/DRAW_LOOP_TIME);
    this.age++;
};

/*
 * Method: evalDeriv
 * Evaluates the derivative of the given system state. This does not use
 * "this.particles"! It uses whatever state is passed to it. Make sure to pass in a
 * state of the correct length. Incorrect behavior would certainly result if
 * you didn't.
 *
 * This particular implementation simply continues the motions of the particles
 * in a straight line with decreasing velocity.
 *
 * This function takes a state not a particle list.
 *
 * Parameters:
 * state - the state at which to calculate the force
 *
 * Member Of: BurstSystem
 */
BurstSystem.prototype.evalDeriv = function(state) {
    var key;
    var deriv = {};
    for (key in state) {
        var particle = state[key];
        var cosine = 0.0;
        var sine = 0.0;
        if (particle[0] - this.x != 0) {
            var angle = Math.atan((particle[1] - this.y) / (particle[0] - this.x));
            if (particle[0] - this.x < 0) {
                angle = angle + Math.PI;
            }
            cosine = Math.cos(angle);
            sine = Math.sin(angle);
        }
        deriv[key] = [particle[2], particle[3], this.accel * cosine, this.accel * sine, 1];
    }
    return deriv;
};

/*
 * Method: isDead
 * Checks to see if the particle system is dead and can be removed. It is dead
 * when it has lived longer than some minimum and all its particles are dead.
 *
 * Member Of: BurstSystem
 */
BurstSystem.prototype.isDead = function() {
    return this.age > this.maxEmittingAge && Object.keys(this.particles).length == 0;
};

/*
 * Method: kill
 * Cleans up when dying.
 *
 * Parameters:
 * game - the game object
 *
 * Member Of: BurstSystem
 */
BurstSystem.prototype.kill = function(game) {
};



///////////////////////////////////////////////////////////////////////////////
///////////////////////// Blackhole Particles System ///////////////////////////
///////////////////////////////////////////////////////////////////////////////



/*
 * Constructor: BlackholeSystem
 * A particle system where all particles are accelerated towards the center.
 */
function BlackholeSystem(x, y, radius, maxAge) {
    ParticleSystem.call(this, x, y);

    this.blackholeRadius = radius*1.5;
    this.particleVelocity = 25;
    this.maxDist = radius * 5;
    this.minDist = radius * 5 - 1;
    this.emitRate = radius*0.8;
    this.maxParticleAge = 500;
    this.mass = 25000*radius*Math.pow(radius, 0.98);
    this.velVar = 2.5/radius;
    this.maxEmittingAge = maxAge * DRAW_LOOP_TIME/LOGIC_LOOP_TIME;
    this.streams = 5;
    this.age = 0;
    this.dead = false;
    this.color = [200, 200, 200];
}

inherits(BlackholeSystem, ParticleSystem);

/*
 * Method: doLogic
 * Runs the logic of the system. Namely, emitting new particles and updating
 * the system.
 *
 * Parameters:
 * game - the game object.
 *
 * Member Of: BlackholeSystem
 */
BlackholeSystem.prototype.doLogic = function(game) {
    var key;
    for (key in this.particles) {
        var particle = this.particles[key];
        if (particle.isDead(this)) {
            delete this.particles[key];
        }
    }
    if (this.age < this.maxEmittingAge && !this.dead) {
        this.addParticles();
    }
    // step forward the system
    trapezoidalStep(this, LOGIC_LOOP_TIME/DRAW_LOOP_TIME);
    this.age++;
};

/*
 * Method: addParticles
 * Adds new particles to the system. These particles' states are simply appended
 * to the existing state, so they must be formatted correctly (each state a
 * vector of x, y, velX, velY, and time).
 *
 * Parameters:
 * newStates - the states of the new particles to add to the particle system
 *
 * Member Of: BlackholeSystem
 */
BlackholeSystem.prototype.addParticles = function(newStates) {
    var newNum = Math.floor(Math.random() * this.emitRate);
    for (i = 0; i < newNum; i++) {
        var angle = 2 * Math.PI * Math.floor(boundedRand(0, this.streams))/this.streams;

        // place the particle a random distance away from the center at this
        // angle
        var dist = boundedRand(this.minDist, this.maxDist);
        var x = Math.cos(angle) * dist;
        var y = Math.sin(angle) * dist;

        // take the angle at 90 degrees, varied, as the start vel
        var velX = this.particleVelocity * (Math.cos(angle + Math.PI * 0.5) - this.velVar/2 + Math.random() * this.velVar);
        var velY = this.particleVelocity * (Math.sin(angle + Math.PI * 0.5) - this.velVar/2 + Math.random() * this.velVar);

        var particle = new BlackholeParticle(this.x + x, this.y + y, velX, velY, scale(this.color, boundedRand(0.5, 1.0)), boundedRand(1, 5), this.blackholeRadius);
        particle.maxAge = this.maxParticleAge;
        this.lastIndex++;
        this.particles[this.lastIndex] = particle;
    }
};

/*
 * Method: evalDeriv
 * Evaluates the derivative of the given system state. This does not use
 * "this.particles"! It uses whatever state is passed to it. Make sure to pass in a
 * state of the correct length. Incorrect behavior would certainly result if
 * you didn't.
 *
 * This particular implementation simply continues the motions of the particles
 * in a straight line with decreasing velocity.
 *
 * This function takes a state not a particle list.
 *
 * Parameters:
 * state - the state at which to calculate the force
 *
 * Member Of: BlackholeSystem
 */
BlackholeSystem.prototype.evalDeriv = function(state) {
    var key;
    var deriv = {};
    for (key in state) {
        var particle = state[key];
        var cosine = 0.0;
        var sine = 0.0;
        var dist = distance(particle[0], particle[1], this.x, this.y);
        if (particle[0] - this.x != 0) {
            var angle = Math.atan((particle[1] - this.y) / (particle[0] - this.x));
            if (particle[0] - this.x < 0) {
                angle = angle + Math.PI;
            }
            cosine = Math.cos(angle);
            sine = Math.sin(angle);
        }
        deriv[key] = [particle[2], particle[3], -1 *this.mass * cosine / Math.pow(dist, 3), -1 *this.mass * sine/Math.pow(dist, 3), 1];
    }
    return deriv;
};

/*
 * Method: isDead
 * Checks to see if the particle system is dead and can be removed. It is dead
 * when it has lived longer than some minimum and all its particles are dead.
 *
 * Member Of: BlackholeSystem
 */
BlackholeSystem.prototype.isDead = function() {
    return this.dead && Object.keys(this.particles).length == 0;
};

/*
 * Method: kill
 * Cleans up when dying.
 *
 * Parameters:
 * game - the game object
 *
 * Member Of: BlackholeSystem
 */
BlackholeSystem.prototype.kill = function(game) {
};
