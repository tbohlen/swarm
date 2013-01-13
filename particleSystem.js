var LIFE_VELOCITY_BUFFER = 5;
var STARTING_LIVES = 50;
var ATTACK_DISTANCE = 40;
var ATTACK_THRUSTERS = 8;
var THRUSTERS = 8;
var CONNECT_DIST = 100;

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
 * x - the x coord of the system
 * y - the y coord of the system
 */
function ParticleSystem(x, y) {
    this.pos = new THREE.Vector2(x, y);
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
function Particle(pos, vel) {
    this.state = [pos, vel, 0];
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
    var scaleNum = 1.0 - (this.state[2]/this.maxAge);
    var color = scale([255.0, 255.0, 255.0], scaleNum);
    var radius = this.radius/scaleNum;
    game.context.fillStyle = "rgb(" + Math.floor(color[0]).toString() + ", " + Math.floor(color[1]).toString() + ", " + Math.floor(color[2]).toString() + ")";
    drawCircle(this.state[0].x, this.state[0].y, this.radius, game.context);
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
function ColorParticle(pos, vel, color) {
    Particle.call(this, pos, vel);
    this.state = [pos, vel, 0];
    this.color = color;
    this.lives = STARTING_LIVES;
    this.radius = 4;
}

inherits(ColorParticle, Particle);

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
    game.context.fillStyle = getColorString(color);
    drawCircle(this.state[0].x, this.state[0].y, this.radius, game.context);
    game.context.fill();
};

/*
 * Method: isDead
 * Returns true if out of "life"
 *
 * Member Of: ColorParticle
 */
ColorParticle.prototype.isDead = function() {
    return this.lives <= 0;
};



///////////////////////////////////////////////////////////////////////////////
////////////////////////////// Attach Particles ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////


/*
 * Constructor: AttackParticle
 * Constructs an attack particle, which will function differently when near an
 * "enemy" object
 *
 * An enemy is any object that has a different value of team
 */
function AttackParticle(pos, vel, color, team) {
    ColorParticle.call(this, pos, vel, color);
    this.team = 0;
    this.target = null;
    this.connected = true;
}

inherits(AttackParticle, ColorParticle);

///////////////////////////////////////////////////////////////////////////////
///////////////////////// Player Particles System ///////////////////////////
///////////////////////////////////////////////////////////////////////////////



/*
 * Constructor: PlayerSystem
 * A particle system where all particles are accelerated towards the center.
 */
function PlayerSystem(x, y, number, color, team) {
    ParticleSystem.call(this, x, y);

    this.others = {}; // the other particles. aka the enemy
    this.team = team

    this.maxDist = 60;
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
    var key;
    var otherKey;
    for (key in this.particles) {
        var particle = this.particles[key];
        // check particle death
        if (particle.isDead()) {
            // show a little flash if the particle died
            var flashColor = [0, 0, 0, 0.8];
            flashColor[0] = particle.color[0];
            flashColor[1] = particle.color[1];
            flashColor[2] = particle.color[2];

            game.noninteracting.addFlash(particle.state[0].x, particle.state[0].y, flashColor);
            delete this.particles[key];
        }

        // check for collisions and closeness to enemy
        var sortedOthers = [];
        for (otherKey in this.others) {
            var other = this.others[otherKey];
            var totRadius = other.radius + particle.radius;
            var totDistance = particle.state[0].distanceTo(other.state[0]);

            // store all decently close particles for further computation
            if (totDistance < ATTACK_DISTANCE) {
                sortedOthers.push([otherKey, totDistance]);
            }

            // check for collisions
            if (totDistance < totRadius) {
                // run the resolve collision function on the two particles
                resolveCollision(particle, other)
                // subtract lives appropriately
                other.lives--;
                particle.lives--;
            }
        }

        // sort the other particles by distance
        sortedOthers.sort(function(a, b) {
            return a[1] - b[1];
        });

        var i;
        // if the particle is already targeting someone, check if it is
        // still alive
        if (particle.target !== null && typeof(particle.target) !== 'undefined') {
            if (!(particle.target in this.others)) {
                particle.target = null;
            }
        }

        // if after checking the target, the particle does not have a target,
        // find a new one
        if (particle.target === null || typeof(particle.target) === 'undefined' || !(particle.target in this.others)) {
            for (i = 0; i < sortedOthers.length; i++) {
                var enemy = sortedOthers[i][0];
                if (enemy in this.others) {
                    particle.target = enemy;
                    particle.connected = false;
                    break;
                }
            }
        }
    }

    // add new particles
    this.replenishParticles();

    // step forward the system
    trapezoidalStep(this, 0.1);
    this.age++;
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
    for (i = 0; i < numNew; i++) {
        var angle = boundedRand(0, Math.PI * 2);

        // place the particle a random distance away from the center at this
        // angle
        var dist = boundedRand(this.minDist, this.maxDist);
        var x = Math.cos(angle) * dist;
        var y = Math.sin(angle) * dist;

        var vel = new THREE.Vector2(0, 0)
        var pos = new THREE.Vector2(this.pos.x + x, this.pos.y + y)

        // add the particle
        var particle = new AttackParticle(pos, vel, this.color, this.team);
        particle.maxAge = this.maxParticleAge;
        this.lastIndex++;
        this.particles[this.lastIndex] = particle;

        // show a little flash
        var flashColor = [0, 0, 0, 0.8];
        flashColor[0] = particle.color[0];
        flashColor[1] = particle.color[1];
        flashColor[2] = particle.color[2];
        game.noninteracting.addFlash(particle.state[0].x, particle.state[0].y, flashColor, "fast");

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
        var newVel = new THREE.Vector2(0, 0);
        var target = this.particles[key].target;
        var dist = this.pos.distanceTo(particle[0]);
        
        // if the particle has a target, attack it
        if (target !== null && typeof(target) !== 'undefined') {
            newVel.sub(particle[0], this.others[target].state[0]);
            newVel.setLength(-1 * ATTACK_THRUSTERS);
        }
        // otherwise, propel the particle normally
        else if (this.particles[key].connected){
            var angleToCenter = this.pos.angleWith(particle[0]);
            var angle = particle[1].angle();

            // randomize the angle
            angle = angle + boundedRand(-1 * this.randomization, this.randomization);
            
            var sine = Math.sin(angle);
            var cosine = Math.cos(angle);
            newVel = new THREE.Vector2(cosine, sine);

            newVel.setLength(THRUSTERS);

            // additional correcting force
            if (dist > this.maxDist) {
                var correction = new THREE.Vector2(Math.cos(angleToCenter), Math.sin(angleToCenter));
                correction.setLength(Math.pow(dist / this.maxDist, this.correctionPower) * this.correctionForce);
                newVel.addSelf(correction)
            }
        }
        else if (dist < CONNECT_DIST) {
            this.particles[key].connected = true;
        }

        // damp a tiny bit just to make sure we don't explode too quickly
        var damping = particle[1].clone();
        var vel = damping.length()
        damping.setLength(-1 * this.damping * vel * dist / (this.maxParticleVel * this.maxDist));

        newVel.addSelf(damping);
        deriv[key] = [particle[1], newVel, 1];
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
    var totDistance = one.state[0].distanceTo(two.state[0]);
    return totRadius > totDistance;
};

/*
 * Function: resolveCollision
 * Resolves a collision between the two particles. This does not handle the case
 * that one and two do not in fact overlap. Passing two such objects will cause
 * unknown behavior (probably nothing bad)
 */
function resolveCollision(one, two) {
    var totRadius = one.radius + two.radius;
    var centersVec = one.state[0].clone();
    centersVec.subSelf(two.state[0]);
    var totDistance = centersVec.length();
    var totVel = one.state[1].clone();
    totVel.addSelf(two.state[1]);
    var totVelMag = totVel.length();
    // this is the normal pointing from one to two
    var normal = centersVec.clone()
    normal.normalize();
    var rewindTime = Math.abs( (totRadius-totDistance) / totVelMag );

    // recompute for one
    var newPosOne = new THREE.Vector2(one.state[0].x - rewindTime * one.state[1].x, one.state[0].y - rewindTime * one.state[1].y);
    var newVelOne = one.state[1].clone();
    var scaledNormalOne = normal.clone();
    scaledNormalOne.setLength(-2 * newVelOne.dot(normal));
    newVelOne.addSelf(scaledNormalOne)
    var oneState = [newPosOne, newVelOne, 1];

    // recompute for two
    var newPosTwo = new THREE.Vector2(two.state[0].x - rewindTime * two.state[1].x, two.state[0].y - rewindTime * two.state[1].y);
    var newVelTwo = two.state[1].clone();
    var scaledNormalTwo = normal.clone();
    scaledNormalTwo.setLength(-2 * newVelTwo.dot(normal));
    newVelTwo.addSelf(scaledNormalTwo)
    var twoState = [newPosTwo, newVelTwo, 1];

    // set the new states
    one.state = oneState;
    two.state = twoState;

    // let the caller know the two objects collided
    return true;
}
