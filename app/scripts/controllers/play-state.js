'use strict';
angular.module('app').controller('PlayStateCtrl', function($scope, $rootScope, $controller, GameService, StateFactory, Asteroid, Miner) {
  var game = GameService.get();
  var state = new StateFactory();
  console.debug('scope:', $scope);

  $rootScope.$on('rescale', state.rescaleAll);

  state.create = function() {

    $scope.asteroids = game.asteroids = game.add.group();
    $scope.miners = game.miners = game.add.group();

    
    
    
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
  };

  state.render = function() {

  };

  state.rescaleAll = function(evt, newScale) {
    $scope.world.scale.setTo(newScale, newScale);
  };

  return state;
});