
'use strict';

angular.module('app').factory('Miner', function($rootScope, GameService) {
  var game = GameService.get();
  var nameCounter = 0;
  var Miner = function(isEnemy) {
    this.spawn = {
      x: game.world.randomX,
      y: game.world.randomY
    };
    this.isEnemy = isEnemy || false;
    

    var skin = this.isEnemy ? 'enemyMiner' : 'miner';

    var coin = game.rnd.integer % 4;
    switch(coin) {
    case 0:
      this.spawn.x = -32;
      this.span.y = game.world.randomY;
      break;
    case 1:
      this.spawn.x = game.world.width + 32;
      this.spany = game.world.randomY;
      break;
    case 2:
      this.spawn.x = game.world.randomX;
      this.spawn.y = -32;
      break;
    case 3:
      this.spawn.x = game.world.randomX;
      this.spawn.y = game.world.height + 32;
      break;
    }
    Phaser.Sprite.call(this, game, this.spawn.x, this.spawn.y, skin);
    this.anchor.setTo(0.5, 0.5);
    this.scale.setTo(GameService.getStat('globalScale'),GameService.getStat('globalScale'));
    this.body.collideWorldBounds = true;
    this.body.maxVelocity.x = 100;
    this.body.maxVelocity.y = 100;
    this.body.drag = {x: 100, y:100};
    this.bulletTime = 0;
    this.pulseTime = 0;
    this.name = (this.isEnemy ? 'enemy-miner-' : 'miner-') + nameCounter;
    this.target = null;
    this.rotationTween = null;
    this.laser = null;
    this.nameText = game.add.bitmapText(this.x, this.y, this.name, {font: '10px minecraftia', align: 'center'});
    this.nameText.anchor.setTo(0.5, 0.5);
    nameCounter++;
    game.add.existing(this);
    this.patrolTween = null;

    
  };

  Miner.prototype = Object.create(Phaser.Sprite.prototype);
  Miner.prototype.constructor = Miner;


  Miner.prototype.mine = function(asteroid) {
    asteroid.attachMiner(this);
  };
  
  Miner.prototype.miningComplete = function() {
    this.mining = false;
    this.laser.kill();
    this.target = null;
    console.debug('mining complete');
  };

  Miner.prototype.update = function() {
    var self = this;
    this.nameText.x = this.x;
    this.nameText.y = this.y - 16;
    this.scale.setTo(GameService.getStat('globalScale'),GameService.getStat('globalScale'));
    this.body.angularVelocity = 0;
    if(!this.mining && this.alive) {
      var closest = {
        asteroid: {}
      };
      game.asteroids.forEachAlive(function(asteroid) {
        if(!asteroid.hasAttachedMiner) {
          var d = game.physics.distanceBetween(self, asteroid);
          var chased = true;
          var chasingMiner = game.enemyMiners.iterate('chasing',asteroid.name, Phaser.Group.RETURN_CHILD) || game.miners.iterate('chasing',asteroid.name, Phaser.Group.RETURN_CHILD);
          var chasingMinerDistance = chasingMiner && chasingMiner.name !== self.name ? game.physics.distanceBetween(chasingMiner, asteroid) : null;
          if(!chasingMiner || chasingMiner.name === self.name || chasingMinerDistance > d) {
            chased = false;
          }
          if(!chased && (!closest.asteroid.distance || d < closest.asteroid.distance)) {
            closest.asteroid.distance = d;
            closest.asteroid.obj = asteroid;
          }
        }
      },true);


      if(closest.asteroid.obj ) {
        this.rotation = game.physics.angleBetween(this, closest.asteroid.obj);
        if (closest.asteroid.distance <= GameService.getStat('miningRange') * GameService.getStat('globalScale') && closest.asteroid.obj.targetable) {
          this.body.velocity.x = 0;
          this.body.velocity.y = 0;
          this.mining = true;
          this.target = closest.asteroid.obj;
          this.laser = this.isEnemy ? game.enemyLasers.getFirstDead() : game.lasers.getFirstDead();
          this.laser.x = this.x;
          this.laser.scale.setTo(GameService.getStat('globalScale'),GameService.getStat('globalScale'));
          this.laser.y = this.y;
          this.laser.rotation = this.rotation - Math.PI/2;
          this.laser.height = closest.asteroid.distance;
          this.laser.width = 1;
          this.laser.revive();
          closest.asteroid.obj.attachMiner(this);
        } else {
          if(this.patrolTween && this.patrolTween.isRunning) {
            this.patrolTween.stop();
            this.body.velocity.x = 0;
            this.body.velocity.y = 0;
          }
          game.physics.moveToObject(this, closest.asteroid.obj, GameService.getStat('minerAcceleration'));
          this.chasing = closest.asteroid.obj.name;
        }
      } else {
        this.patrol();
      }
    }
  };
  Miner.prototype.kill = function() {
    console.debug('killing miner');
    Phaser.Sprite.prototype.kill.call(this);
    this.nameText.destroy();
    if(this.laser) { this.laser.kill(); }
    if(this.target) { this.target.detachMiner(); }
    this.mining = false;
    this.chasing = null;
  };
  Miner.rotationTweenCallback = function() {
    this.pulse();
  };

  Miner.prototype.patrol = function() {
    var x,y;
    if(!this.patrolTween || !this.patrolTween.isRunning) {
      this.body.velocity.x = 0;
      this.body.velocity.y = 0;
      x = game.world.randomX;
      y = game.world.randomY;
      this.rotation = game.physics.angleToXY(this, x, y);
      this.patrolTween = game.add.tween(this).to({x: x, y: y}, 5000, Phaser.Easing.Linear.None, true);
    }
  };

  return Miner;
});