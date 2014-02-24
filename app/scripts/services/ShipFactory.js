
angular.module('app').factory('ShipFactory', function($rootScope, GameService) {
  var game = GameService.get()
  var nameCounter = 0;
  var Ship = function(x, y) {
    this.spawn = {
      x: x || game.width/2,
      y: y || game.height/2
    };
    
    Phaser.Sprite.call(this, game, this.spawn.x, this.spawn.y, 'ship');
    this.anchor.setTo(0.5, 0.5);
    this.body.collideWorldBounds = true;
    this.body.maxVelocity.x = 100;
    this.body.maxVelocity.y = 100
    this.body.drag = {x: 100, y:100}
    this.bulletTime = 0;
    this.pulseTime = 0;
    this.name = 'ship-' + nameCounter;
    this.target = {};
    this.rotationTween = null;
    nameCounter++;
    game.add.existing(this);
    
  };

  Ship.prototype = Object.create(Phaser.Sprite.prototype);
  Ship.prototype.constructor = Ship;

  Ship.prototype.pulse = function() { 
    if(game.time.now > this.pulseTime) {
      this.body.velocity.x += Math.sin(this.rotation);
      this.body.velocity.y += -Math.cos(this.rotation);
    }
  }  

  Ship.prototype.fire = function() { 
    if (game.time.now > this.bulletTime && this.alive) {
        this.bulletTime  = game.time.now + GameService.getStat('bulletInterval');  
        var bullet = game.bullets.getFirstDead();
        bullet.revive();
        bullet.x = this.x;
        bullet.y = this.y;
        bullet.body.velocity.x = Math.sin(this.rotation) * GameService.getStat('bulletSpeed');
        bullet.body.velocity.y = -Math.cos(this.rotation) * GameService.getStat('bulletSpeed');
      
      }
  }

  Ship.prototype.respawn = function() {
    this.x = this.spawn.x;
    this.y = this.spawn.y;
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
    this.revive();
  }

  Ship.prototype.update = function() {
    var self = this;

    this.body.angularVelocity = 0;

    if(this.game.input.keyboard.isDown(Phaser.Keyboard.W)) {
      if(game.time.now > this.pulseTime) {
        this.pulse();  
        this.pulseTime = game.time.now + GameService.getStat('pulseInterval');
      }
      
      
    }
    if(this.game.input.keyboard.isDown(Phaser.Keyboard.A)) {
      this.angle -= .1
    }

    if(this.game.input.keyboard.isDown(Phaser.Keyboard.D)) {
      this.angle += .1
    }

    if(this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
      this.fire();
      
    }

    
      var closest = {
        asteroid: {},
        money: {}
      };
      game.asteroids.forEachAlive(function(asteroid) { 
        var d = game.physics.distanceBetween(self, asteroid);
        if( ! closest.asteroid.distance || d < closest.asteroid.distance) { 
          closest.asteroid.distance = d;
          closest.asteroid.obj = asteroid;
        }
      });
      game.money.forEachAlive(function(money) { 
        var d = game.physics.distanceBetween(self, money);
        if(! closest.money.distance || d < closest.money.distance) { 
          closest.money.distance = d;
          closest.money.obj = money;
        }
      });

      if(closest.asteroid.obj && closest.asteroid.distance <= GameService.getStat('sensorRange')) {
        this.target.obj = null;
        this.rotation = game.physics.angleBetween(this, closest.asteroid.obj) + (Math.PI/2) * 3;
        this.pulse();
      }
      else if(closest.asteroid.obj) {
        this.rotation = game.physics.angleBetween(this, closest.asteroid.obj) + Math.PI/2;
      } 
      

      if(closest.money.obj && closest.money.distance < closest.asteroid.distance) {
        game.physics.accelerateToObject(self, closest.money.obj,GameService.getStat('shipAcceleration') );
      }
      else {
        if((this.body.x > this.spawn.x + 25 || this.body.x < this.spawn.x - 25) || (this.body.y > this.spawn.y + 25 || this.body.y < this.spawn.y - 25)) {
          game.physics.accelerateToXY(self, self.spawn.x, self.spawn.y, GameService.getStat('shipAcceleration'));
        }
      }

      this.fire();

      if(this.target.gatherTime && this.target.gatherTime >= game.time.now) {
        this.target.obj = null;
        this.target.gatherTime = null;
      }
      game.physics.overlap(this,this.target.obj, function() {
        self.target.obj = null;
      });
  };
  
  Ship.rotationTweenCallback = function() {
    this.pulse();
  };

  

  return Ship;
});