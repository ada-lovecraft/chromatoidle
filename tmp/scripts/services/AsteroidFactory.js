'use strict';
angular.module('app').factory('Asteroid', function($rootScope, GameService) {
  var game = GameService.get();
  var nameCounter = 0;
  var Asteroid = function() {
    Phaser.Sprite.call(this, game, 0,0, 'asteroid');

    this.rotateSpeed = game.rnd.integerInRange(1,40) / 10;
    this.anchor.setTo(0.5,0.5);

    //this.outOfBoundsKill = true;

    this.name = 'asteroid-' + nameCounter;
    nameCounter++;

    this.nameText = game.add.bitmapText(this.x, this.y, this.name, {font: '10px minecraftia', align: 'center'});
    this.nameText.anchor.setTo(0.5, 0.5);

    this.initialize();
    this.enter();

    this.events.onRevived.add(function() {
      this.initialize();
      this.enter();
    }, this);


  };

  Asteroid.prototype = Object.create(Phaser.Sprite.prototype);
  Asteroid.prototype.constructor = Asteroid;

  Asteroid.prototype.initialize = function() {
    var coin = game.rnd.integer() % 4;

    switch(coin) {
    case 0:
      this.x = game.world.randomX;
      this.y = -32;
      break;
    case 1:
      this.x = game.world.randomX;
      this.y = game.world.height + 32;
      break;
    case 2:
      this.y = game.world.randomY;
      this.x = -32;
      break;
    case 3:
      this.x = game.world.width + 32;
      this.y = game.world.randomY;
      break;
    }

    this.maxHealth = this.health = GameService.getStat('asteroidValue');
    this.scale.x = this.scale.y =  GameService.getStat('globalScale');
    this.targetable = false;
    this.hasAttachedMiner = false;
    this.attachedMiner = null;
    
    this.input.start();
    this.input.useHandCursor = true;
    
    this.miningTimer = 0;


  };
  Asteroid.prototype.enter = function() {
    var targetX = game.world.randomX;
    var targetY = game.world.randomY;
    game.add.tween(this).to({x: targetX, y: targetY},2000, Phaser.Easing.Cubic.Out,true).onComplete.add(function() {
      this.targetable = true;
      this.alpha = 1;
      this.visible = true;
      this.exists = true;
      this.alive = true;
    }, this);
  }
  Asteroid.prototype.update = function() {
    this.nameText.x = this.x;
    this.nameText.y = this.y;
    this.angle += this.rotateSpeed;
    if((this.input.pointerDown(game.input.activePointer.id) && !this.hasAttachedMiner && this.alive && game.time.now >= this.miningTimer)) {
      this.mine();
    }
    if(this.hasAttachedMiner && this.alive && game.time.now >= this.miningTimer) {
      this.mine();
    }

    if(game.time.now >= this.miningTimer) {
      game.add.tween(this).to({alpha: 1}, 100, Phaser.Easing.Linear.None, true);
    }

  };
  Asteroid.prototype.mine = function() {
    var scale;
    
    this.miningTimer = game.time.now + GameService.getStat('miningSpeed');
    if(!this.hasAttachedMiner || (this.hasAttachedMiner && !this.attachedMiner.isEnemy)) {
      GameService.modifyMoney();
    }
    this.health--;
    scale = (this.health / this.maxHealth * GameService.getStat('globalScale'));
    game.add.tween(this.scale).to({x: scale, y: scale}, GameService.getStat('miningSpeed'), Phaser.Easing.Elastic.Out, true).onComplete.add(function() {
      if(this.health <= 0) {
        this.kill();
        this.input.stop();
        this.detachMiner();
      }
    }, this);
    game.add.tween(this).to({alpha: 0.5}, 100, Phaser.Easing.Linear.None, true);
    $rootScope.$apply();
  };

  Asteroid.prototype.attachMiner = function(miner) {
    this.hasAttachedMiner = true;
    this.attachedMiner = miner;
  };

  Asteroid.prototype.detachMiner = function() {
    if(this.hasAttachedMiner) {
      this.attachedMiner.miningComplete();
      delete this.attachedMiner;
      this.hasAttachedMiner = false;
    }
  };

  return Asteroid;
});
