angular.module('app').controller('MainCtrl', function($scope, $log, $interval, GameService, localStorageService) {
  $scope.message = "Hello, World!";
  $log.debug('yo');
  GameService.init('asteroidle-game');
  var game = GameService.get();
  GameService.addState('boot', 'BootStateCtrl', $scope);
  GameService.addState('play', 'PlayStateCtrl', $scope);
  GameService.switchState('boot');
  
  GameService.updateStats({score: 12});
  
  $scope.stats = GameService.getStats();
  var stats = localStorageService.get('asteroidle-stats') || {
    maxAsteroids: 1, 
    bulletInterval: 500, 
    bulletSpeed: 200, 
    money: 0, 
    autopilot: false,
    pulseInterval: 100,
    sensorRange: 50,
    shipAcceleration: 0,
    maxShips: 1,
    respawnRate: 5000,
  };
  
  GameService.updateStats(stats);


  $scope.$watch(GameService.getStats, function(newVal) {
    $scope.stats = newVal;
    $scope.updateOptions();
    localStorageService.add('asteroidle-stats', newVal);
  },true);

  $scope.$on('respawnCountdown', function(evt, count, max) {
    $scope.respawn = {
      respawning: true,
      count: count,
      max: max
    };
    console.debug('respawn:', $scope.respawn);
  });
  $scope.$on('respawnFinish', function(evt) {
    $scope.respawn.respawning = false;
  });


  $scope.updateOptions = function() {
    if($scope.stats.money >= 10) {
      $scope.showMoreBulletUpgrades = true;
      $scope.showFasterBulletUpgrades = true;
    }
    if($scope.stats.money >= 20) {
      $scope.showShipRepairs = true;
    }
    if($scope.stats.money >= 25) {
      $scope.showAsteroidUpgrades = true;
    }
  }

  $scope.purchaseMoreBullets = function(amount, level) {
    GameService.increaseMoney(-amount);
    var bi = GameService.getStat('bulletInterval');
    GameService.updateStats({bulletInterval: bi - 100});
  }

  $scope.purchaseFasterBullets = function(amount, level) {
    GameService.increaseMoney(-amount);
    var bs = GameService.getStat('bulletSpeed');
    GameService.updateStats({bulletSpeed: bs +50});

  }

  $scope.purchaseShipRepairs = function(amount, level) {
    switch(level) {
      case 1:
        GameService.updateStats({shipAcceleration: 10});
        GameService.increaseMoney(-amount);
        break;
    }

  }

  $scope.purchaseAsteroidUpgrades = function(amount, level) {
    switch(level) {
      case 1:
        GameService.updateStats({maxAsteroids: 2});
        GameService.increaseMoney(-amount);
        break;
    }

  }


});