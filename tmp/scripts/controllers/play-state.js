'use strict';
angular.module('app').controller('PlayStateCtrl', function($scope, $rootScope, $controller, GameService, StateFactory, Asteroid, Miner) {
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
    $scope.lasers = game.lasers = game.add.group();
    $scope.lasers.createMultiple(100,'laser');
    $scope.lasers.setAll('anchor.x',0);
    $scope.lasers.setAll('anchor.y',0);

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

    $scope.maxLivingThings = GameService.getStat('asteroids') + GameService.getStat('miners');
    var newScale = (1000 - $scope.maxLivingThings) / 2000 ;
    GameService.setStat('globalScale', 0, newScale);
  };

  state.render = function() {

  };

  state.rescaleAll = function(evt, newScale) {
    $scope.world.scale.setTo(newScale, newScale);
  };

  return state;
});