
'use strict';

angular.module('app').factory('Miner', function($rootScope, GameService) {
  var game = GameService.get();
  var nameCounter = 0;
  var Miner = function(x, y) {
    this.spawn = {
      x: x || game.width/2,
      y: y || game.height/2
    };
    


    Phaser.Sprite.call(this, game, this.spawn.x, this.spawn.y, 'miner');
    this.anchor.setTo(0.5, 0.5);
    this.scale.setTo(GameService.getStat('globalScale'),GameService.getStat('globalScale'));
    this.body.collideWorldBounds = true;
    this.body.maxVelocity.x = 100;
    this.body.maxVelocity.y = 100;
    this.body.drag = {x: 100, y:100};
    this.bulletTime = 0;
    this.pulseTime = 0;
    this.name = 'miner-' + nameCounter;
    this.target = {};
    this.rotationTween = null;
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
  };

  Miner.prototype.update = function() {
    var self = this;
    this.scale.setTo(GameService.getStat('globalScale'),GameService.getStat('globalScale'));
    this.body.angularVelocity = 0;
    if(!this.mining) {
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
        this.target.obj = null;
        this.rotation = game.physics.angleBetween(this, closest.asteroid.obj);
        if (closest.asteroid.distance <= GameService.getStat('miningRange') && closest.asteroid.targetable) {
          
          this.body.velocity.x = 0;
          this.body.velocity.y = 0;
          this.mining = true;
          closest.asteroid.obj.attachMiner(this);
        } else {
          game.physics.moveToObject(this, closest.asteroid.obj, GameService.getStat('minerAcceleration'));
        }
      }
    }
  };
  
  Miner.rotationTweenCallback = function() {
    this.pulse();
  };

  return Miner;
});