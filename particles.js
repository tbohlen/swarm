
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
    this.pos = pos;
    this.vel = vel;
    this.age = 0;
    this.maxAge = 10;
    this.lives = 1;
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
    var scaleNum = 1.0 - (this.age/this.maxAge);
    var color = scale([255.0, 255.0, 255.0], scaleNum);
    var radius = this.radius/scaleNum;
    game.context.fillStyle = "rgb(" + Math.floor(color[0]).toString() + ", " + Math.floor(color[1]).toString() + ", " + Math.floor(color[2]).toString() + ")";
    drawCircle(this.pos, this.radius, game.context);
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

/*
 * Method: die
 * Does nothing (called immediately before the particle is removed from the game)
 *
 * Member Of: Particle
 */
Particle.prototype.die = function() {
    // do nothing
};

/*
 * Method: doLogic
 * Description...
 *
 * Parameters:
 * Param - desc...
 *
 * Member Of: Particle
 */
Particle.prototype.doLogic = function(game) {
    // body
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
    this.color = color;
    this.lives = STARTING_LIVES;
    this.radius = RADIUS;
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
    drawCircle(this.pos, this.radius, game.context);
    game.context.fill();
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
function AttackParticle(pos, vel, color, system) {
    ColorParticle.call(this, pos, vel, color);
    this.team = system.team;
    this.target = null;
    this.connected = true;
    this.attacking = false;
    this.sys = system;
    this.attackDelay = 0;
    this.key = -1;
}

inherits(AttackParticle, ColorParticle);

/*
 * Method: collide
 * Checks for and handles collisions with other particles.
 *
 * Parameters:
 * Param - desc...
 *
 * Member Of: AttackParticle
 */
AttackParticle.prototype.collide = function(others) {
    // body
};

/*
 * Method: evalDeriv
 * Evaluates the derivative of the state of this particle given state as the
 * current state of the particle.
 *
 * Parameters:
 * state - the state of the particle to calculate off of
 *
 * Member Of: AttackParticle
 */
AttackParticle.prototype.evalDeriv = function(state) {
    var pos = state[0];
    var vel = state[1];
    var age = state[2];
    var attackDelay = state[3]
    var accel = new THREE.Vector2(0, 0);
    var delayIncr = 0;
    var dist = this.sys.pos.distanceTo(pos);
    
    // if the particle has a target, attack it
    if (this.target !== null && typeof(this.target) !== 'undefined') {
        if (attackDelay > ATTACK_DELAY) {
            accel.sub(pos, this.target.pos);
            var attackDist = pos.distanceTo(this.target.pos)
            accel.setLength(-1 * ATTACK_THRUSTERS);
        }
        delayIncr = 1;
    }
    // propel the particle normally if it has no target and is connected
    else if (this.connected){
        var angleToCenter = this.sys.pos.angleWith(pos);
        var angle = vel.angle();

        // randomize the angle
        angle = angle + boundedRand(-1 * this.sys.randomization, this.sys.randomization);
        
        var sine = Math.sin(angle);
        var cosine = Math.cos(angle);
        accel = new THREE.Vector2(cosine, sine);

        accel.setLength(THRUSTERS);

        // additional correcting force
        if (dist > this.sys.maxDist) {
            var correction = new THREE.Vector2(Math.cos(angleToCenter), Math.sin(angleToCenter));
            correction.setLength(Math.pow(dist / this.sys.maxDist, this.sys.correctionPower) * this.sys.correctionForce);
            accel.addSelf(correction)
        }
    }
    else if (dist < CONNECT_DIST) {
        this.connected = true;
    }

    // damp a tiny bit just to make sure we don't explode too quickly
    var damping = vel.clone();
    var velMag = damping.length()
    damping.setLength(-1 * this.sys.damping * velMag * dist / (this.sys.maxParticleVel * this.sys.maxDist));
    
    accel.addSelf(damping);

    // bound the length to the maximum speed
    if (accel.length() > MAX_SPEED) {
        accel.setLength(MAX_SPEED);
    }
    return [vel, accel, 1, delayIncr];
};

/*
 * Method: doLogic
 * does logic
 *
 * Parameters:
 * game - game object
 *
 * Member Of: AttackParticle
 */
AttackParticle.prototype.doLogic = function(game) {
    // sort the other particles by distance
    this.distances.sort(function(a, b) {
        return a[1] - b[1];
    });

    var i;
    // if the particle is already targeting someone, check if it is
    // still alive
    if (this.target !== null && typeof(this.target) !== 'undefined') {
        if (!(this.target.isDead())) {
            this.target = null;
        }
    }

    // if after checking the target, the particle does not have a target,
    // find a new one
    if (this.target === null || typeof(this.target) === 'undefined' || this.target.isDead()) {
        for (i = 0; i < this.distances.length; i++) {
            var enemy = window.game.collidables[ this.distances[i][0] ];
            var dist = this.distances[i][1];
            var homeDist = this.sys.pos.distanceTo(this.pos);

            if (enemy.team !== this.team) {
                if (dist > ATTACK_DISTANCE && homeDist < dist){
                    // if the particle is closer to its owner than anything to
                    // attack, and nothing to attack is closer than the attack
                    // distance, then rejoin the swarm
                    this.attacking = false;
                    this.connected = true;
                    break;
                }
                else if (this.attacking && enemy.attacking && !enemy.isDead()) {
                    // if the this is already in attack mode then attack any
                    // available enemy who is also attacking
                    this.target = enemy;
                    this.attacking = true;
                    this.connected = false;
                    break;
                }
                else if (dist < ATTACK_DISTANCE && !enemy.isDead()) {
                    // if an enemy is closer than the attack distance, then
                    // start attacking it
                    this.target = enemy;
                    this.attacking = true;
                    this.connected = false;
                    break;
                }
            }
        }
    }
};

/*
 * Method: isDead
 * Returns true if out of "life"
 *
 * Member Of: AttackParticle
 */
AttackParticle.prototype.isDead = function() {
    return this.lives <= 0;
};

/*
 * Method: die
 * Cleans up immediately before the particle is going to be removed from the
 * game. Shows a flash where the particle used to be and removes it from its
 * system.
 *
 * Member Of: AttackParticle
 */
AttackParticle.prototype.die = function() {
    // show a little flash if the particle died
    var flashColor = [0, 0, 0, 0.8];
    flashColor[0] = this.color[0];
    flashColor[1] = this.color[1];
    flashColor[2] = this.color[2];

    window.game.noninteracting.addFlash(this.pos, flashColor);
    delete this.sys.particles[this.key];
};
