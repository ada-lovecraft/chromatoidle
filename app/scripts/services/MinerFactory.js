
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
    this.name = 'miner-' + nameCounter;
    this.target = null;
    this.rotationTween = null;
    this.laser = null;
    nameCounter++;
    game.add.existing(this);

    
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
    this.scale.setTo(GameService.getStat('globalScale'),GameService.getStat('globalScale'));
    this.body.angularVelocity = 0;
    if(!this.mining && this.alive) {
      var closest = {
        asteroid: {}
      };
      game.asteroids.forEachAlive(function(asteroid) {
        if(!asteroid.hasAttachedMiner) {
          var d = game.physics.distanceBetween(self, asteroid);
          if( ! closest.asteroid.distance || d < closest.asteroid.distance) {
            closest.asteroid.distance = d;
            closest.asteroid.obj = asteroid;
          }
        }
      });


      if(closest.asteroid.obj ) {
        this.rotation = game.physics.angleBetween(this, closest.asteroid.obj);
        if (closest.asteroid.distance <= GameService.getStat('miningRange') * GameService.getStat('globalScale') && closest.asteroid.obj.targetable) {
          this.body.velocity.x = 0;
          this.body.velocity.y = 0;
          this.mining = true;
          this.target = closest.asteroid.obj;
          console.debug('isEnemy', this.isEnemy, this.isEnemy ? 'enemyLaser' : 'friendlyLaser');
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
          game.physics.moveToObject(this, closest.asteroid.obj, GameService.getStat('minerAcceleration'));
        }
      }
    }
  };
  Miner.prototype.kill = function() {
    console.debug('killing miner');
    Phaser.Sprite.prototype.kill.call(this);
    if(this.laser) { this.laser.kill(); }
    if(this.target) { this.target.detachMiner(); }
    this.mining = false;
  };
  Miner.rotationTweenCallback = function() {
    this.pulse();
  };

  return Miner;
});