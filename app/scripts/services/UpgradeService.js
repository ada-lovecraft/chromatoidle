'use strict';

angular.module('app').factory('UpgradeService', function($log, $rootScope,$timeout, $controller, GameService, localStorageService) {
  var upgrades = {
    miningSpeed: {
      label: 'Mining Speed',
      stat: 'miningSpeed',
      levels: [
        { cost: 0, value: 2000 },
        { cost: 10, value: 1750 },
        { cost: 100, value: 1500 },
        { cost: 1000, value: 1250},
        { cost: 10000, value: 1000 },
        { cost: 100000, value: 750 },
        { cost: 1000000, value: 500 },
        { cost: 10000000, value: 250 },
        { cost: 100000000, value: 125 },
        { cost: 1000000000, value: 75 },
        { cost: 10000000000, value: 25 }
      ]
    },
    miningRange: {
      label: 'Mining Range',
      stat: 'miningRange',
      levels: [
        { cost: 0, value: 32 },
        { cost: 10, value: 64 },
        { cost: 100, value: 128 },
        { cost: 1000, value: 256},
        { cost: 10000, value: 512 },
        { cost: 100000, value: 1024 }
      ]
    },
    minerAcceleration: {
      label: 'Miner Flight Speed',
      stat: 'minerAcceleration',
      levels: [
        { cost: 0, value: 25 },
        { cost: 10, value: 50 },
        { cost: 100, value: 75 },
        { cost: 1000, value: 100},
        { cost: 10000, value: 250 },
        { cost: 100000, value: 500 }
      ]
    },
    asteroids: {
      label: 'More Asteroids',
      stat: 'asteroids',
      levels: [
        { cost: 0, value: 1 },
        { cost: 10, value: 2 },
        { cost: 100, value: 5 },
        { cost: 1000, value: 20 },
        { cost: 10000, value: 50 },
        { cost: 100000, value: 100 },
        { cost: 1000000, value: 500 },
        { cost: 10000000, value: 1000 },
        { cost: 100000000, value: 2000 },
        { cost: 1000000000, value: 5000 },
        { cost: 1000000000, value: 10000 }
      ]
    },
    asteroidValue: {
      label: 'More Valuable Asteroids',
      stat: 'asteroidValue',
      levels: [
        { cost: 0, value: 3 },
        { cost: 10, value: 4 },
        { cost: 100, value: 5 },
        { cost: 1000, value: 6 },
        { cost: 10000, value: 7 },
        { cost: 100000, value: 8 },
        { cost: 1000000, value: 9 },
        { cost: 10000000, value: 10 },
        { cost: 100000000, value: 11 },
        { cost: 1000000000, value: 12 },
        { cost: 1000000000, value: 15 }
      ]
    },

  };
  var purchasables = {
    miners: {
      label: 'Miner',
      stat: 'miners',
      cost: 10,
      purchased: false
    },
    defenders: {
      label: 'Defender',
      stat: 'defenders',
      cost: 100,
      purchased: false
    },
    hunters: {
      label: 'Hunter',
      stat: 'hunters',
      cost: 1000,
      purchased: false
    },
    destroyers: {
      label: 'Destroyer',
      stat: 'destroyers',
      cost: 10000,
      purchased: false
    }
  };

  return {
    upgrades: function() {
      return upgrades;
    },
    purchasables: function() {
      return purchasables;
    },
    purchaseUpgrade: function(upgrade, level) {
      upgrades[upgrade].levels[level].purchased = true;
      console.debug('purchasing upgrade:', upgrade, level);
      GameService.setStat(upgrades[upgrade].stat, level, upgrades[upgrade].levels[level].value);
      GameService.modifyMoney(-upgrades[upgrade].levels[level].cost);
    },
    purchaseItem: function(item) {
      var p = purchasables[item];
      GameService.modifyStat(p.stat);
      GameService.modifyMoney(-p.cost);


    },
    init: function(u) {
      var key, value;
      for (key in u) {
        value = u[key];
        if(upgrades[key]) {
          GameService.setStat(key, value.level, upgrades[key].levels[value.level].value);
        } else {
          GameService.setStat(key, 0, value.value);
        }
      }
    },
  };
});