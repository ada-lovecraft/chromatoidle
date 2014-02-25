'use strict';

angular.module('app').controller('MainCtrl', function($scope, $log, $interval, GameService, UpgradeService, localStorageService) {
  $log.debug('yo');
  GameService.init('asteroidle-game');
  GameService.addState('boot', 'BootStateCtrl', $scope);
  GameService.addState('play', 'PlayStateCtrl', $scope);
  GameService.switchState('boot');
  
  
  $scope.upgrades = UpgradeService.upgrades();
  $scope.purchasables = UpgradeService.purchasables();
  localStorageService.clearAll();
  var stats = localStorageService.get('asteroidle-stats') || {
    money: {level: 0, value: 0},
    minerAcceleration: {level: 0, value: 0},
    miningSpeed: {level: 0, value: 0},
    miningRange: {level: 0, value: 0},
    asteroids: {level: 0, value: 0},
    asteroidValue: {level: 0, value: 0},
    globalScale: {level:0, value: 1},
    miners: {level: 0, value: 0}
  };
  
  UpgradeService.init(stats);
  $scope.stats = GameService.getStats();


  $scope.$watch(GameService.getStats, function(newVal) {
    $scope.stats = newVal; 
    localStorageService.add('asteroidle-stats', newVal);
  },true);

  $scope.purchaseUpgrade = function(upgrade, level) {
    UpgradeService.purchaseUpgrade(upgrade, level);
  };

  $scope.purchaseItem = function(stat) {
    UpgradeService.purchaseItem(stat);
  };




});