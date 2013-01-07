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
    return false;
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
    var color = this.color;
    var radius = this.radius;
    game.context.fillStyle = "rgb(" + Math.floor(color[0]).toString() + ", " + Math.floor(color[1]).toString() + ", " + Math.floor(color[2]).toString() + ")";
    drawCircle(this.state[0], this.state[1], this.radius, game.context);
    game.context.fill();
};



///////////////////////////////////////////////////////////////////////////////
///////////////////////// Player Particles System ///////////////////////////
///////////////////////////////////////////////////////////////////////////////



/*
 * Constructor: PlayerSystem
 * A particle system where all particles are accelerated towards the center.
 */
function PlayerSystem(x, y, number) {
    ParticleSystem.call(this, x, y);

    this.maxDist = 50;
    this.minDist = 40;
    this.particleThruster = 10;
    this.randomization = 1000;
    this.correctionForce = 4.0;
    this.damping = 0.9;

    this.maxParticleAge = 500;
    this.age = 0;
    this.color = [50, 150, 50];

    this.addParticles(number);
}

inherits(PlayerSystem, ParticleSystem);

/*
 * Method: doLogic
 * Runs the logic of the system. Namely, emitting new particles and updating
 * the system.
 *
 * Parameters:
 * game - the game object.
 *
 * Member Of: PlayerSystem
 */
PlayerSystem.prototype.doLogic = function(game) {
    var key;
    for (key in this.particles) {
        var particle = this.particles[key];
        if (particle.isDead(this)) {
            delete this.particles[key];
        }
    }
    // step forward the system
    trapezoidalStep(this, 0.1);
    this.age++;
};

/*
 * Method: addParticles
 * Adds new particles to the system. These particles' states are simply appended
 * to the existing state, so they must be formatted correctly (each state a
 * vector of x, y, velX, velY, and time).
 *
 * Parameters:
 * numNew - the number of new particles to add
 *
 * Member Of: PlayerSystem
 */
PlayerSystem.prototype.addParticles = function(numNew) {
    for (i = 0; i < numNew; i++) {
        var angle = boundedRand(0, Math.PI * 2);

        // place the particle a random distance away from the center at this
        // angle
        var dist = boundedRand(this.minDist, this.maxDist);
        var x = Math.cos(angle) * dist;
        var y = Math.sin(angle) * dist;

        // take the angle at 90 degrees, varied, as the start vel
        var velX = 0;
        var velY = 0;

        var particle = new ColorParticle(this.x + x, this.y + y, velX, velY, scale(this.color, boundedRand(0.5, 1.0)));
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
 * Member Of: PlayerSystem
 */
PlayerSystem.prototype.evalDeriv = function(state) {
    var key;
    var deriv = {};
    for (key in state) {
        var particle = state[key];
        var dist = distance(particle[0], particle[1], this.x, this.y);

        var angleToCenter = Math.atan((this.y - particle[1])/(this.x - particle[0]));
        if (particle[0] - this.x < 0) {
            angleToCenter = angleToCenter + Math.PI;
        }

        // random (vaguely) radial dir
        var sine = Math.sin(angleToCenter);
        var cosine = Math.cos(angleToCenter);
        var dir = new THREE.Vector2(cosine + this.randomization * boundedRand(-1, 1), sine + this.randomization * boundedRand(-1, 1));

        dir.setLength(-1 * this.particleThruster * boundedRand(0.5, 1.0));

        // additional correcting force
        if (dist > this.minDist) {
            var correction = new THREE.Vector2(cosine, sine);
            correction.setLength(-1 * Math.pow(dist / this.maxDist, 2) * this.correctionForce);
            dir.addSelf(correction)
        }

        // damp a tiny bit just to make sure we don't explode too quickly
        var damping = new THREE.Vector2(particle[2], particle[3]);
        damping.setLength(-1 * this.damping * Math.pow(dist / this.maxDist, 2))

        dir.addSelf(damping);

        var newDeriv = [particle[2], particle[3], dir.x, dir.y, 1];
        deriv[key] = newDeriv;
    }
    return deriv;
};
