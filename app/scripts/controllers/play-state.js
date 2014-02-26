'use strict';
angular.module('app').controller('PlayStateCtrl', function($scope, $rootScope, $controller, GameService, StateFactory, Asteroid, Miner, Defender) {
  console.debug('play state');
  var game = GameService.get();
  var state = new StateFactory();
  console.debug('scope:', $scope);

  $rootScope.$on('rescale', state.rescaleAll);
  $scope.livingThings = 0;
  $scope.lastRescale = 0;
  $scope.lastScale = 1;

  state.create = function() {
    $scope.asteroids = game.asteroids = game.add.group();
    $scope.miners = game.miners = game.add.group();
    $scope.defenders = game.defenders = game.add.group();
    $scope.lasers = game.lasers = game.add.group();
    $scope.bullets = game.bullets = game.add.group();

    $scope.enemyMiners = game.enemyMiners = game.add.group();
    $scope.enemyBullets = game.enemyBullets = game.add.group();
    $scope.enemyLasers = game.enemyLasers = game.add.group();

    $scope.lasers.createMultiple(100,'laser');
    $scope.lasers.setAll('anchor.x',0);
    $scope.lasers.setAll('anchor.y',0);

    $scope.bullets.createMultiple(100,'bullet');
    $scope.bullets.setAll('anchor.x',0);
    $scope.bullets.setAll('anchor.y',0);
    $scope.bullets.setAll('outOfBoundsKill', true);

    $scope.enemyLasers.createMultiple(100,'enemyLaser');
    $scope.enemyLasers.setAll('anchor.x',0);
    $scope.enemyLasers.setAll('anchor.y',0);

    $scope.enemyBullets.createMultiple(100,'bullet');
    $scope.enemyBullets.setAll('anchor.x',0);
    $scope.enemyBullets.setAll('anchor.y',0);


  };

  state.update = function() {
    if ($scope.asteroids.countLiving() < GameService.getStat('asteroids')) {
      var asteroid = new Asteroid();
      $scope.asteroids.add(asteroid);
    }

    if($scope.miners.countLiving() < GameService.getStat('miners')) {
      var miner = new Miner();
      $scope.miners.add(miner);
    }

    if($scope.defenders.countLiving() < GameService.getStat('defenders')) {
      var defender = new Defender();
      $scope.defenders.add(defender);
    }
    /*
    if(game.rnd.integer() % 100 === 0) {
      var enemyMiner = new Miner(true);
      $scope.enemyMiners.add(enemyMiner);
    }*/
    if($scope.enemyMiners.countLiving() < 1) {
      var enemyMiner = new Miner(true);
      $scope.enemyMiners.add(enemyMiner);
    }

    $scope.maxLivingThings = GameService.getStat('asteroids') + GameService.getStat('miners');
    var newScale = (1000 - $scope.maxLivingThings) / 2750 ;
    GameService.setStat('globalScale', 0, newScale);

    game.physics.collide($scope.enemyMiners, $scope.bullets, state.destroyEnemyHandler);
    
  };

  state.render = function() {

  };

  state.rescaleAll = function(evt, newScale) {
    $scope.world.scale.setTo(newScale, newScale);
  };
  state.destroyEnemyHandler = function(enemy, bullet) {
    enemy.kill();
    bullet.kill();
  };

  return state;
});