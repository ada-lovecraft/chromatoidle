'use strict';
angular.module('app').service('GameService', function($log, $rootScope,$timeout, $controller) {
  var game = null;
  var stats = {};
  var numOnScreen = 0;
  var lastScale = 0;
  $log.debug('game service init');

  return {
    get: function() {
      if(!game) {
        throw 'game not instantiated. You must call GameService.init(\'dom id\') first;';
      }
      return game;
    },
    init: function(selector) {
      var config = {
        width: 800,
        height: 600,
        parent: selector,
        antialias: true,
        forceSetTimeout: true
      };
      game = new Phaser.Game(config);
      $log.debug('game instantiated:', game);
    },
    addState: function(stateName, controllerName, scope) {
      var newScope = scope.$new();
      var controller = $controller(controllerName, {$scope: newScope});
      game.state.add(stateName, controller);
    },
    switchState: function(stateName) {
      game.state.start(stateName);
    },
    getStats: function() {
      return stats;
    },
    getStat: function(stat) {
      return stats[stat].value;
    },
    setStat: function(stat, level, value) {
      level = level || 0;
      stats[stat] = {
        level: level,
        value: value
      };
    },
    modifyMoney: function(amount) {
      amount = amount || 1;
      stats.money.value += amount;
      if(amount > 0) {
        if(stats.totalMoney) {
          stats.totalMoney.value += amount;
        } else {
          stats.totalMoney = { value: amount};
        }
      }
    },
    modifyStat: function(stat, amount) {
      amount = amount || 1;
      stats[stat].level = 0;
      stats[stat].value += amount;
    },
    setStartPosition: function(obj) {
      var coin = game.rnd.integer() % 4;
      switch(coin) {
      case 0:
        obj.x = -32;
        obj.y = game.world.randomY;
        break;
      case 1:
        obj.x = game.world.width + 32;
        obj.y = game.world.randomY;
        break;
      case 2:
        obj.x = game.world.randomX;
        obj.y = -32;
        break;
      case 3:
        obj.x = game.world.randomX;
        obj.y = game.world.height + 32;
        break;
      }
    }
  };
});
