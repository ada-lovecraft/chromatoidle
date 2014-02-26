
'use strict';

angular.module('app').factory('Defender', function($rootScope, GameService) {
  var game = GameService.get();
  var nameCounter = 0;
  var Defender = function(isEnemy) {
    this.spawn = {
      x: game.world.randomX,
      y: game.world.randomY
    };
    this.isEnemy = isEnemy || false;

    var skin = 'defender';
    if (this.isEnemy) {
      skin = 'enemyDefender';
    }
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
    this.name = 'defender-' + nameCounter;
    this.target = {};
    this.rotationTween = null;
    this.movementTween = game.add.tween(this);
    this.patrolTime = 0;
    
    nameCounter++;
    game.add.existing(this);

    
  };

  Defender.prototype = Object.create(Phaser.Sprite.prototype);
  Defender.prototype.constructor = Defender;

  Defender.prototype.fire = function() {
    if (game.time.now > this.bulletTime && this.alive) {
      this.bulletTime = game.time.now + GameService.getStat('defenderBulletInterval');
      var bullet = this.isEnemy ? game.enemyBullets.getFirstDead() : game.bullets.getFirstDead();
      bullet.x = this.x;
      bullet.y = this.y;
      bullet.body.velocity.x = Math.sin(this.rotation) * GameService.getStat('defenderBulletSpeed');
      bullet.body.velocity.y = -Math.cos(this.rotation) * GameService.getStat('defenderBulletSpeed');
      bullet.rotation = this.rotation - Math.PI / 2;
      bullet.scale.setTo(0.75 * GameService.getStat('globalScale'), 0.75 * GameService.getStat('globalScale'));

      bullet.revive();
    }
  };
  
  Defender.prototype.update = function() {
    var self = this;
    this.scale.setTo(GameService.getStat('globalScale'),GameService.getStat('globalScale'));
    this.body.angularVelocity = 0;
    var closest = {
      enemy: {}
    };
    game.enemyMiners.forEachAlive(function(asteroid) {
      if(!asteroid.hasAttachedDefender) {
        var d = game.physics.distanceBetween(self, asteroid);
        if( !closest.enemy.distance || d < closest.enemy.distance) {
          closest.enemy.distance = d;
          closest.enemy.obj = asteroid;
        }
      }
    });


    if(closest.enemy.obj ) {
      this.rotation = game.physics.angleBetween(this, closest.enemy.obj) + Math.PI / 2;
      if (closest.enemy.distance <= GameService.getStat('defenderDistance')) {
        this.body.velocity.x = 0;
        this.body.velocity.y = 0;
        this.fire();
      } else {
        game.physics.moveToObject(this, closest.enemy.obj, GameService.getStat('defenderAcceleration'));
      }

    } else {
      this.patrol();
    }
  };

  Defender.prototype.patrol = function() {
    if(game.time.now > this.patrolTime ) {
      this.patrolTime = game.time.now + 2000;
      console.debug('not running');
      var targetX = game.world.randomX,
        targetY = game.world.randomY;
      this.rotation = game.physics.angleToXY(this,targetX, targetY) + Math.PI / 2;
      game.physics.accelerateToXY(this, targetX, targetY, GameService.getStat('defenderAcceleration'), GameService.getStat('defenderAcceleration') * 1.5,GameService.getStat('defenderAcceleration') * 1.5);
    }
  };
  return Defender;
});