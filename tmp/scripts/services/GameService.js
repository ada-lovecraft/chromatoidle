angular.module('app').service('GameService', function($log, $rootScope,$timeout, $controller) {
  var game = null;
  var stats = {};
  $log.debug('game service init');

  return {
    get: function() {
      if(!game) {
        throw 'game not instantiated. You must call GameService.init(\'dom id\') first;'
      }
      return game;
    },
    init: function(selector) {
      game = new Phaser.Game(800, 600, Phaser.CANVAS, selector);
      $log.debug('game instantiated:', game);
    },
    addState: function(stateName, controllerName, scope) {
      var scope = scope.$new();
      var controller = $controller(controllerName, {$scope: scope});
      game.state.add(stateName, controller);
    },
    switchState: function(stateName) {
      game.state.start(stateName);
    },
    getStats: function() {
      return stats;
    },
    getStat: function(stat) {
      return stats[stat];
    },
    updateStats: function(newStats) {
      $timeout(function() {
        angular.extend(stats, newStats);  
      }, 0);
    },
    increaseMoney: function(amount) {
      stats.money += amount;
      if(amount > 0) {
        if(stats.totalMoney)
          stats.totalMoney += amount;
        else
          stats.totalMoney = amount;
      }
    }
  }
});