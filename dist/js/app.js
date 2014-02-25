window.requestAnimationFrame = null;
var app = angular.module('app',['ui.bootstrap','ui','views','ngRoute','LocalStorageModule']);

app.config(function($routeProvider) {
  console.debug('Setting up routes')
  $routeProvider.when('/', {
    templateUrl: '/views/main.html',
    controller: 'MainCtrl'
  });
});

'use strict';
angular.module('app').controller('BootStateCtrl', function($scope, $log, GameService, StateFactory) {
  $log.debug('bootState');
  var game = GameService.get();
  var state = new StateFactory();
  var ready = false;

  state.preload = function() {
    console.debug('loading....');
    game.load.onLoadComplete.addOnce(state.onLoadComplete, state);
    game.load.image('miner', 'img/sputnik-small.png');
    game.load.image('bullet', 'img/bullet.png');
    game.load.image('asteroid', 'img/comet-small.png');
    game.load.image('money', 'img/money.png');
    game.load.bitmapFont('minecraftia', 'fonts/minecraftia.png', 'fonts/minecraftia.xml');

  };

  state.create = function() {
    
  };

  state.update = function() {
    if (!!ready) {
      GameService.switchState('play');
    }
  };

  state.onLoadComplete = function() {
    ready = true;
    console.debug('loaded...');
  };

  return state;

});
'use strict';

angular.module('app').controller('MainCtrl', function($scope, $log, $interval, GameService, UpgradeService, localStorageService) {
  $log.debug('yo');
  GameService.init('asteroidle-game');
  GameService.addState('boot', 'BootStateCtrl', $scope);
  GameService.addState('play', 'PlayStateCtrl', $scope);
  GameService.switchState('boot');
  
  
  $scope.upgrades = UpgradeService.upgrades();
  $scope.purchasables = UpgradeService.purchasables();
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
'use strict';
angular.module('app').factory('Asteroid', function($rootScope, GameService) {
  var game = GameService.get();
  var nameCounter = 0;
  var Asteroid = function() {
    var self = this;
    Phaser.Sprite.call(this, game, 0,0, 'asteroid');
    
    this.rotateSpeed = game.rnd.integerInRange(1,40) / 10;
    this.anchor.setTo(0.5,0.5);
    this.maxHealth = this.health = GameService.getStat('asteroidValue');
    this.scale.x = this.scale.y =  GameService.getStat('globalScale');

    
    //this.outOfBoundsKill = true;
    this.input.start();
    this.input.useHandCursor = true;
    this.miningTimer = 0;
    this.coin = game.rnd.integer() % 4;

    switch(this.coin) {
    case 0:
      this.x = game.world.randomX;
      this.y = -32;
      break;
    case 1:
      this.x = game.world.randomX;
      this.y = game.world.height + 32;
      break;
    case 2:
      this.y = game.world.randomY;
      this.x = -32;
      break;
    case 3:
      this.x = game.world.width + 32;
      this.y = game.world.randomY;
      break;
    }
    
    this.movementTween = game.add.tween(this);
    this.alphaTween = game.add.tween(this);

    this.shrinkTween = game.add.tween(this.scale);
    this.name = 'asteroid-' + nameCounter;
    nameCounter++;
    var targetX = game.world.randomX;
    var targetY = game.world.randomY;

    this.movementTween.to({x: targetX, y: targetY},2000, Phaser.Easing.Cubic.Out);
    this.movementTween.start();
    this.alphaTween.to({alpha:0.5}, 500, Phaser.Easing.Cubic.Out);

    this.miningText = game.add.bitmapText(this.x, this.y, '+1', {font: '16px minecraftia', align: 'center'});
    this.miningText.anchor.setTo(0.5, 0.5);
    this.miningText.alpha = 0;
  };

  Asteroid.prototype = Object.create(Phaser.Sprite.prototype);
  Asteroid.prototype.constructor = Asteroid;
  

  Asteroid.prototype.create = function() {
  };

  Asteroid.prototype.update = function() {
    var scale;
    this.angle += this.rotateSpeed;
    if((this.input.pointerDown(game.input.activePointer.id) || this.hasAttachedMiner) && this.alive && game.time.now >= this.miningTimer) {
      this.miningTimer = game.time.now + GameService.getStat('miningSpeed');
      GameService.modifyMoney();
      this.health--;
      this.miningText.alpha = 1;
      scale = this.health / this.maxHealth * GameService.getStat('globalScale');
      this.miningText.x = this.x;
      this.miningText.y = this.y - this.height/2;
      game.add.tween(this.scale).to({x: scale, y: scale}, GameService.getStat('miningSpeed'), Phaser.Easing.Elastic.Out, true).onComplete.add(function() {
        if(this.health === 0) {
          this.kill();
          this.detachMiner();
          
        }
      }, this);
      game.add.tween(this).to({alpha: 0.5}, 100, Phaser.Easing.Linear.None, true);
      game.add.tween(this.miningText).to({y: this.miningText.y - 50, alpha: 0}, 500, Phaser.Easing.Linear.None, true);
      $rootScope.$apply();
    }
    
    if(game.time.now >= this.miningTimer) {
      game.add.tween(this).to({alpha: 1}, 100, Phaser.Easing.Linear.None, true);
    }
  };

  Asteroid.prototype.attachMiner = function(miner) {
    this.hasAttachedMiner = true;
    this.attachedMiner = miner;
  };

  Asteroid.prototype.detachMiner = function() {
    if(this.hasAttachedMiner) {
      this.attachedMiner.miningComplete();
      this.attachedMiner = null;
      this.hasAttachedMiner = false;
    }
  };

  return Asteroid;
});
'use strict';
angular.module('app').service('GameService', function($log, $rootScope,$timeout, $controller) {
  var game = null;
  var stats = {};
  $log.debug('game service init');

  return {
    get: function() {
      if(!game) {
        throw 'game not instantiated. You must call GameService.init(\'dom id\') first;';
      }
      return game;
    },
    init: function(selector) {
      game = new Phaser.Game(800, 600, Phaser.AUTO, selector);
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
      stats[stat] = {
        level: level,
        value: value
      };

      if(stats.asteroids && stats.miners && stats.globalScale && stats.asteroids.value + stats.miners.value % 5 === 0) {
        stats.globalScale.level = 0;
        stats.globalScale.value = stats.globalScale.value * 0.66;
      }
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
      if(stats.asteroids.value + stats.miners.value % 5 === 0) {
        stats.globalScale.level = 0;
        stats.globalScale.value = stats.globalScale.value * 0.66;
      }
    }
  };
});

'use strict';

angular.module('app').factory('Miner', function($rootScope, GameService) {
  var game = GameService.get();
  var nameCounter = 0;
  var Miner = function(x, y) {
    this.spawn = {
      x: x || game.width/2,
      y: y || game.height/2
    };
    


    Phaser.Sprite.call(this, game, this.spawn.x, this.spawn.y, 'miner');
    this.anchor.setTo(0.5, 0.5);
    this.scale.setTo(GameService.getStat('globalScale'),GameService.getStat('globalScale'));
    this.body.collideWorldBounds = true;
    this.body.maxVelocity.x = 100;
    this.body.maxVelocity.y = 100;
    this.body.drag = {x: 100, y:100};
    this.bulletTime = 0;
    this.pulseTime = 0;
    this.name = 'miner-' + nameCounter;
    this.target = {};
    this.rotationTween = null;
    nameCounter++;
    game.add.existing(this);

    
  };

  Miner.prototype = Object.create(Phaser.Sprite.prototype);
  Miner.prototype.constructor = Miner;


  Miner.prototype.mine = function(asteroid) {
    asteroid.attachMiner(this);
  };
  
  Miner.prototype.miningComplete = function() {
    this.mining = false;
  };

  Miner.prototype.update = function() {
    var self = this;
    this.scale.setTo(GameService.getStat('globalScale'),GameService.getStat('globalScale'));
    this.body.angularVelocity = 0;
    if(!this.mining) {
      var closest = {
        asteroid: {}
      };
      game.asteroids.forEachAlive(function(asteroid) {
        if(!asteroid.hasAttachedMiner) {
          var d = game.physics.distanceBetween(self, asteroid);
          if( ! closest.asteroid.distance || d < closest.asteroid.distance) {
            closest.asteroid.distance = d;
            closest.asteroid.obj = asteroid;
          }
        }
      });


      if(closest.asteroid.obj ) {
        this.target.obj = null;
        this.rotation = game.physics.angleBetween(this, closest.asteroid.obj);
        if (closest.asteroid.distance <= GameService.getStat('miningRange')) {
          
          this.body.velocity.x = 0;
          this.body.velocity.y = 0;
          this.mining = true;
          closest.asteroid.obj.attachMiner(this);
        } else {
          game.physics.moveToObject(this, closest.asteroid.obj, GameService.getStat('minerAcceleration'));
        }
      }
    }
  };
  
  Miner.rotationTweenCallback = function() {
    this.pulse();
  };

  return Miner;
});
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
'use strict';
angular.module('app').factory('StateFactory', function() {
  var State = function() {

  };

  State.prototype = {
    preload: function() {},
    create: function() {},
    update: function() {},
    onLoadComplete: function() {}
  };
  
  return State;
});
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
      debugger
      GameService.setStat(upgrades[upgrade].stat, level, upgrades[upgrade].levels[level].value);
      GameService.modifyMoney(-upgrades[upgrade].levels[level].cost);
    },
    purchaseItem: function(item) {
      var p = purchasables[item];
      GameService.modifyStat(p.stat);
      GameService.modifyMoney(-p.cost);


    },
    init: function(u) {
      _.each(u, function(value, key) {
        if(upgrades[key]) {
          GameService.setStat(key, value.level, upgrades[key].levels[value.level].value);
        } else {
          GameService.setStat(key, 0, value.value);
        }
      });

    },
  };
});