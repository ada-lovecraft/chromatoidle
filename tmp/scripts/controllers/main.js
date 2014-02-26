'use strict';

angular.module('app').controller('MainCtrl', function($scope, $log, $interval, GameService, UpgradeService, localStorageService) {
  $log.debug('yo');
  GameService.init('asteroidle-game');
  GameService.addState('boot', 'BootStateCtrl', $scope);
  GameService.addState('play', 'PlayStateCtrl', $scope);
  var defaults = {
    money: {level: 0, value: 0},
    minerAcceleration: {level: 0, value: 0},
    miningSpeed: {level: 0, value: 0},
    miningRange: {level: 0, value: 64},
    asteroids: {level: 0, value: 0},
    asteroidValue: {level: 0, value: 0},
    globalScale: {level:0, value: 1},
    miners: { level: 0, value: 0},
    defenders:{ level:0, value:0 },
    defenderBulletInterval: {level:0, value: 1500},
    defenderAcceleration: {level: 0, value: 40},
    defenderBulletSpeed: {level: 0, value: 300},
    defenderDistance: {level: 0, value: 100}
  };
  
  
  $scope.upgrades = UpgradeService.upgrades();
  $scope.purchasables = UpgradeService.purchasables();
  var stats = localStorageService.get('asteroidle-stats');
  console.debug('stats:', stats);
  if(!stats) {
    stats = defaults;
  }
  else {
    _.defaults(stats, defaults);
  }
  console.debug('stats:', stats);
  UpgradeService.init(stats);
  $scope.stats = GameService.getStats();

  GameService.switchState('boot');


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