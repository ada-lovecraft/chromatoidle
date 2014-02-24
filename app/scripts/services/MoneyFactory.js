angular.module('app').factory('MoneyFactory', function($rootScope, GameService) {
  var game = GameService.get();
  var Money = function(x, y,  amount) {
    Phaser.Sprite.call(this, game, x, y, 'money');

    this.rotateSpeed = 0.1;
    this.anchor.setTo(0.5,0.5);
    this.body.velocity.x = game.rnd.integerInRange(-10,10);
    this.body.velocity.y = game.rnd.integerInRange(-10,10);

    this.body.collideWorldBounds = true;
    this.body.bounce.setTo(1,1);
    this.value = amount;
    this.input.start();
    this.input.useHandCursor = true;
    

  }

  Money.prototype = Object.create(Phaser.Sprite.prototype)
  Money.prototype.constructor = Money;
  

  Money.prototype.create = function() {


  }
  Money.prototype.update = function() {
    this.angle += this.rotateSpeed;
    if(this.input.pointerDown(game.input.activePointer.id) && this.alive) {
      var money = GameService.getStat('money');
      console.debug('money:', money, this.value, money + this.value);
      GameService.increaseMoney(this.value);
      this.kill();
      $rootScope.$apply();
    };
  };

  return Money;
});