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
        var thisDeriv = deriv[key];
        var scaledDeriv = [];
        var next = [new THREE.Vector2(0, 0), new THREE.Vector2(0, 0), 0];

        scaledDeriv[0] = thisDeriv[0].clone();
        scaledDeriv[0].multiplyScalar(timeStep);
        scaledDeriv[1] = thisDeriv[1].clone();
        scaledDeriv[1].multiplyScalar(timeStep);
        scaledDeriv[2] = thisDeriv[2] * timeStep;
        particle[0].addSelf(scaledDeriv[0]);
        particle[1].addSelf(scaledDeriv[1]);
        particle[2] += thisDeriv[2] * timeStep
        particle[3] += thisDeriv[3];
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
        var thisDeriv = deriv[key];
        var scaledDeriv = [];
        var next = [new THREE.Vector2(0, 0), new THREE.Vector2(0, 0), 0];

        scaledDeriv[0] = thisDeriv[0].clone();
        scaledDeriv[0].multiplyScalar(timeStep);
        scaledDeriv[1] = thisDeriv[1].clone();
        scaledDeriv[1].multiplyScalar(timeStep);
        scaledDeriv[2] = thisDeriv[2] * timeStep;
        next[0].add(particle[0], scaledDeriv[0]);
        next[1].add(particle[1], scaledDeriv[1]);
        next[2] = particle[2] + thisDeriv[2] * timeStep
        next[3] = particle[3] + thisDeriv[3];
        nextState[key] = next;
    }

    // find the derivative at this next state
    var nextDeriv = system.evalDeriv(nextState);

    // use the two derivatives to find a better approximate state
    for (key in currentState) {
        var particle = nextState[key];
        var thisDerivOne = deriv[key];
        var thisDerivTwo = deriv[key];
        var next = [new THREE.Vector2(0, 0), new THREE.Vector2(0, 0), 0];

        thisDerivOne[0].multiplyScalar(timeStep * 0.5);
        thisDerivOne[1].multiplyScalar(timeStep * 0.5);
        thisDerivTwo[0].multiplyScalar(timeStep * 0.5);
        thisDerivTwo[1].multiplyScalar(timeStep * 0.5);

        next[0].add(particle[0], thisDerivOne[0]);
        next[0].addSelf(thisDerivTwo[0]);
        next[1].add(particle[1], thisDerivOne[1]);
        next[1].addSelf(thisDerivTwo[1]);
        next[2] = particle[2] + (thisDerivOne[2] + thisDerivTwo[2]) * timeStep * 0.5
        next[3] = particle[3] + (thisDerivOne[2] + thisDerivTwo[2]) * 0.5;

        currentState[key] = next;
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
 * pos - the position of the particle
 */
function ParticleSystem(pos) {
    this.pos = pos;
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
        var vel = new THREE.Vector2(0, 0);
        vel.x = this.particleVelocity * (Math.cos(angle) - 0.3 + Math.random() * 0.6);
        vel.y = this.particleVelocity * (Math.sin(angle) - 0.3 + Math.random() * 0.6);
        var particle = new Particle(this.pos, vel);
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
        var part = this.particles[key];
        state[key] = [part.pos, part.vel, part.age, part.attackDelay];
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
        var part = this.particles[key];
        var state = newState[key];
        part.pos = state[0];
        part.vel = state[1];
        part.age = state[2];
        part.attackDelay = state[3];
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


/*
 * Method: die
 * Does nothing
 *
 * Member Of: ParticleSystem
 */
ParticleSystem.prototype.die = function() {
    // do nothing
};



///////////////////////////////////////////////////////////////////////////////
///////////////////////// Player Particles System ///////////////////////////
///////////////////////////////////////////////////////////////////////////////



/*
 * Constructor: PlayerSystem
 * A particle system where all particles are accelerated towards the center.
 */
function PlayerSystem(pos, number, color, team) {
    ParticleSystem.call(this, pos);

    this.others = {}; // the other particles. aka the enemy
    this.team = team

    this.maxDist = 50;
    this.minDist = 30;
    this.randomization = 30000.0;
    this.correctionForce = 2;
    this.correctionPower = 2.0;
    this.damping = 0.8;
    this.maxParticleVel = 10;

    this.maxParticleAge = 500;
    this.age = 0;
    this.color = color;
    this.maxParticles = number;
    this.addCounter = 0;
    this.addTime = Math.floor(1000/LOGIC_LOOP_TIME);

    this.addParticles(number);
}

inherits(PlayerSystem, ParticleSystem);

/*
 * Method: replenishParticles
 * Adds more particles to the system, if there is space and the add counter has
 * incremented sufficiently since the last particle was added (this incorporates
 * a delay between particle adds that is fully controllable using addTime.
 *
 * Member Of: PlayerSystem
 */
PlayerSystem.prototype.replenishParticles = function() {
    if (this.addCounter < this.addTime) {
        this.addCounter++;
    }
    else {
        if (Object.keys(this.particles).length < this.maxParticles) {
            // add a particle
            this.addParticles(1);
            // reset the counter
            this.addCounter = 0;
        }
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
 * Member Of: PlayerSystem
 */
PlayerSystem.prototype.doLogic = function(game) {
    // add new particles
    this.replenishParticles();

    // step forward the system
    trapezoidalStep(this, TIME_STEP);
    this.age += TIME_STEP;
};

/*
 * Method: addParticles
 * Adds new particles to the system. These particles' states are simply appended
 * to the existing state, so they must be formatted correctly (each state a
 * vector of pos, vel, age)
 *
 * Parameters:
 * numNew - the number of new particles to add
 *
 * Member Of: PlayerSystem
 */
PlayerSystem.prototype.addParticles = function(numNew) {
    var self = this;
    for (i = 0; i < numNew; i++) {
        var makeOne = function() {
            var angle = boundedRand(0, Math.PI * 2);

            // place the particle a random distance away from the center at this
            // angle
            var dist = boundedRand(self.minDist, self.maxDist);
            var x = Math.cos(angle) * dist;
            var y = Math.sin(angle) * dist;

            var vel = new THREE.Vector2(0, 0)
            var pos = new THREE.Vector2(self.pos.x + x, self.pos.y + y)

            // add the particle
            var particle = new AttackParticle(pos, vel, self.color, self);
            particle.maxAge = self.maxParticleAge;
            self.lastIndex++;
            particle.key = self.lastIndex;
            self.particles[self.lastIndex] = particle;

            window.game.addSprite(particle, true);

            // show a little flash
            var flashColor = [0, 0, 0, 0.8];
            flashColor[0] = particle.color[0];
            flashColor[1] = particle.color[1];
            flashColor[2] = particle.color[2];
            window.game.noninteracting.addFlash(particle.pos, flashColor, "fast");
        }

        // XXX: running these consecutively is a cheat to prevent them from having
        // collision resolution issues
        window.setTimeout(makeOne, i * 10);
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
        var particle = this.particles[key];
        deriv[key] = particle.evalDeriv(state[key]);
    }
    return deriv;
};

/*
 * Function: collides
 * Checks to see if two particles collide. Particles must have round hitboxes.
 *
 * Parameters:
 * one - one particle
 * two - the other particle
 */

function collides(one, two) {
    var totRadius = two.radius + one.radius;
    var totDistance = one.pos.distanceTo(two.pos);
    return totRadius > totDistance;
};

/*
 * Function: resolveCollision
 * Resolves a collision between the two particles. This does not handle the case
 * that one and two do not in fact overlap. Passing two such objects will cause
 * unknown behavior (probably nothing bad)
 */
function resolveCollision(one, two) {
    var totRadius = one.radius + two.radius + COLLISION_EPSILON;
    var centersVec = one.pos.clone();
    centersVec.subSelf(two.pos);
    var totDistance = centersVec.length();
    var totVel = one.vel.clone();
    totVel.addSelf(two.vel);
    var totVelMag = totVel.length();
    // this is the normal pointing from one to two
    var normal = centersVec.clone()
    normal.normalize();
    var rewindTime = Math.abs( (totRadius-totDistance) / totVelMag );

    // recompute for one
    var newVelOne = one.vel.clone();
    var scaledNormalOne = normal.clone();
    scaledNormalOne.setLength(-2.0 * newVelOne.dot(normal));
    newVelOne.addSelf(scaledNormalOne)
    var newPosOne = new THREE.Vector2(one.pos.x + rewindTime * (newVelOne.x - one.vel.x), one.pos.y + rewindTime * (newVelOne.y - one.vel.y));

    // recompute for two
    var newVelTwo = two.vel.clone();
    var scaledNormalTwo = normal.clone();
    scaledNormalTwo.setLength(-2.0 * newVelTwo.dot(normal));
    newVelTwo.addSelf(scaledNormalTwo)
    var newPosTwo = new THREE.Vector2(two.pos.x + rewindTime * (newVelTwo.x - two.vel.x), two.pos.y + rewindTime * (newVelTwo.y - two.vel.y));

    // set the new states
    one.pos = newPosOne;
    one.vel = newVelOne;
    two.pos = newPosTwo;
    two.vel = newVelTwo;

    // let the caller know the two objects collided
    return true;
}
