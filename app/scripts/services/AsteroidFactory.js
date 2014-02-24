angular.module('app').factory('AsteroidFactory', function(GameService) {
  var game = GameService.get()
  var nameCounter = 0;
  var Asteroid = function(clone,hp, invertVelocities, scale) {
    var x = 0,
        y = 0,
        self = this;

    Phaser.Sprite.call(this, game, 0,0, 'asteroid');
    this.toX, this.toY, this.startX, this.startY;
    this.coin = game.rnd.integer() % 4
    this.coin = 0;



    scale = scale || 1;

    if(!clone) {
      switch(this.coin) {
        case 0:
          this.startX = game.world.randomX;
          this.startY = 0;
          
          break;
        case 1:
          this.startX = game.world.randomX;
          this.startY = game.world.height;
          break;
        case 2:
          this.startY = game.world.randomY;
          break;
        case 3:
          this.startX = game.world.width;
          this.startY = game.world.randomY;
          break;

      }
    }
    else {
      var mult = 1;
      if(invertVelocities)
        mult = -1
      this.startX = clone.x;
      this.startY = clone.y;
    }

    this.rotateSpeed = game.rnd.integerInRange(1,50) / 10;
    
    this.anchor.setTo(0.5,0.5);
    this.scale.setTo(scale, scale);
    this.health = hp || 100;
    this.body.x = this.startX;
    this.body.y = this.startY;
    this.body.maxVelocity.x = 50;
    this.body.maxVelocity.y = 50;

    this.body.collideWorldBounds = true;
   
    this.body.velocity.x = game.rnd.integerInRange(-100,100);
    this.body.velocity.y = game.rnd.integerInRange(-100,100);
    
    this.body.bounce.setTo(1,1);


    this.name = 'asteroid-' + nameCounter;
    nameCounter++;

  }

  Asteroid.prototype = Object.create(Phaser.Sprite.prototype)
  Asteroid.prototype.constructor = Asteroid;
  

  Asteroid.prototype.create = function() {


  }
  Asteroid.prototype.update = function() {
    //this.angle += this.rotateSpeed;
  };





  return Asteroid;
});