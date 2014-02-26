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
    game.load.image('laser', 'img/laser.png');
    game.load.image('enemyLaser', 'img/enemy-laser.png');
    game.load.image('enemyMiner', 'img/enemy-small.png');
    game.load.image('bullet', 'img/bullet.png');
    game.load.image('enemyBullet', 'img/enemy-bullet.png');
    game.load.image('defender', 'img/defender.png');
    game.load.image('enemyDefender', 'img/enemy-defender.png');

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
    this.targetable = false;

    this.shrinkTween = game.add.tween(this.scale);
    this.name = 'asteroid-' + nameCounter;
    nameCounter++;
    var targetX = game.world.randomX;
    var targetY = game.world.randomY;

    this.movementTween.to({x: targetX, y: targetY},2000, Phaser.Easing.Cubic.Out);
    this.movementTween.start();
    this.movementTween.onComplete.add(function() {
      this.targetable = true;
    }, this);
    this.alphaTween.to({alpha:0.5}, 500, Phaser.Easing.Cubic.Out);

    this.nameText = game.add.bitmapText(this.x, this.y, this.name, {font: '10px minecraftia', align: 'center'});
    this.nameText.anchor.setTo(0.5, 0.5);

  };

  Asteroid.prototype = Object.create(Phaser.Sprite.prototype);
  Asteroid.prototype.constructor = Asteroid;
  

  Asteroid.prototype.create = function() {
  };

  Asteroid.prototype.update = function() {
    this.nameText.x = this.x;
    this.nameText.y = this.y - 16;
    this.angle += this.rotateSpeed;
    if((this.input.pointerDown(game.input.activePointer.id) && !this.hasAttachedMiner && this.alive && game.time.now >= this.miningTimer)) {
      this.mine();
    }
    if(this.hasAttachedMiner && this.alive && game.time.now >= this.miningTimer) {
      this.mine();
    }

    if(game.time.now >= this.miningTimer) {
      game.add.tween(this).to({alpha: 1}, 100, Phaser.Easing.Linear.None, true);
    }

  };
  Asteroid.prototype.mine = function() {
    var scale;
    this.miningTimer = game.time.now + GameService.getStat('miningSpeed');
    if(!this.hasAttachedMiner || (this.hasAttachedMiner && !this.attachedMiner.isEnemy)) {
      GameService.modifyMoney();
    }
    this.health--;
    scale = (this.health / this.maxHealth * GameService.getStat('globalScale'));
    game.add.tween(this.scale).to({x: scale, y: scale}, GameService.getStat('miningSpeed'), Phaser.Easing.Elastic.Out, true).onComplete.add(function() {
      if(this.health <= 0) {
        this.kill();
        this.detachMiner();
        this.nameText.destroy();
        
      }
    }, this);
    game.add.tween(this).to({alpha: 0.5}, 100, Phaser.Easing.Linear.None, true);
    $rootScope.$apply();
  };

  Asteroid.prototype.attachMiner = function(miner) {
    this.hasAttachedMiner = true;
    this.attachedMiner = miner;
  };

  Asteroid.prototype.detachMiner = function() {
    if(this.hasAttachedMiner) {
      this.attachedMiner.miningComplete();
      this.hasAttachedMiner = false;
    }
  };

  return Asteroid;
});

'use strict';

angular.module('app').factory('Defender', function($rootScope, GameService) {
  var game = GameService.get();
  var nameCounter = 0;
  var Defender = function(isEnemy) {
    this.spawn = {
      x: game.world.randomX,
      y: game.world.randomY
    };
    this.isEnemy = isEnemy || false;

    var skin = 'defender';
    if (this.isEnemy) {
      skin = 'enemyDefender';
    }
    var coin = game.rnd.integer % 4;
    switch(coin) {
    case 0:
      this.spawn.x = -32;
      this.span.y = game.world.randomY;
      break;
    case 1:
      this.spawn.x = game.world.width + 32;
      this.spany = game.world.randomY;
      break;
    case 2:
      this.spawn.x = game.world.randomX;
      this.spawn.y = -32;
      break;
    case 3:
      this.spawn.x = game.world.randomX;
      this.spawn.y = game.world.height + 32;
      break;
    }
    Phaser.Sprite.call(this, game, this.spawn.x, this.spawn.y, skin);
    this.anchor.setTo(0.5, 0.5);
    this.scale.setTo(GameService.getStat('globalScale'),GameService.getStat('globalScale'));
    this.body.collideWorldBounds = true;
    this.body.maxVelocity.x = 100;
    this.body.maxVelocity.y = 100;
    this.body.drag = {x: 100, y:100};
    this.bulletTime = 0;
    this.pulseTime = 0;
    this.name = 'defender-' + nameCounter;
    this.target = {};
    this.rotationTween = null;
    this.movementTween = game.add.tween(this);
    this.patrolTime = 0;
    
    nameCounter++;
    game.add.existing(this);

    
  };

  Defender.prototype = Object.create(Phaser.Sprite.prototype);
  Defender.prototype.constructor = Defender;

  Defender.prototype.fire = function() {
    if (game.time.now > this.bulletTime && this.alive) {
      this.bulletTime = game.time.now + GameService.getStat('defenderBulletInterval');
      var bullet = this.isEnemy ? game.enemyBullets.getFirstDead() : game.bullets.getFirstDead();
      bullet.x = this.x;
      bullet.y = this.y;
      bullet.body.velocity.x = Math.sin(this.rotation) * GameService.getStat('defenderBulletSpeed');
      bullet.body.velocity.y = -Math.cos(this.rotation) * GameService.getStat('defenderBulletSpeed');
      bullet.rotation = this.rotation - Math.PI / 2;
      bullet.scale.setTo(0.75 * GameService.getStat('globalScale'), 0.75 * GameService.getStat('globalScale'));

      bullet.revive();
    }
  };
  
  Defender.prototype.update = function() {
    var self = this;
    this.scale.setTo(GameService.getStat('globalScale'),GameService.getStat('globalScale'));
    this.body.angularVelocity = 0;
    var closest = {
      enemy: {}
    };
    game.enemyMiners.forEachAlive(function(asteroid) {
      if(!asteroid.hasAttachedDefender) {
        var d = game.physics.distanceBetween(self, asteroid);
        if( !closest.enemy.distance || d < closest.enemy.distance) {
          closest.enemy.distance = d;
          closest.enemy.obj = asteroid;
        }
      }
    });


    if(closest.enemy.obj ) {
      this.rotation = game.physics.angleBetween(this, closest.enemy.obj) + Math.PI / 2;
      if (closest.enemy.distance <= GameService.getStat('defenderDistance')) {
        this.body.velocity.x = 0;
        this.body.velocity.y = 0;
        this.fire();
      } else {
        game.physics.moveToObject(this, closest.enemy.obj, GameService.getStat('defenderAcceleration'));
      }

    } else {
      this.patrol();
    }
  };

  Defender.prototype.patrol = function() {
    if(game.time.now > this.patrolTime ) {
      this.patrolTime = game.time.now + 2000;
      console.debug('not running');
      var targetX = game.world.randomX,
        targetY = game.world.randomY;
      this.rotation = game.physics.angleToXY(this,targetX, targetY) + Math.PI / 2;
      game.physics.accelerateToXY(this, targetX, targetY, GameService.getStat('defenderAcceleration'), GameService.getStat('defenderAcceleration') * 1.5,GameService.getStat('defenderAcceleration') * 1.5);
    }
  };
  return Defender;
});
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
      game = new Phaser.Game(800, 600, Phaser.AUTO, selector);
      game.config = { forceSetTimeout: true } ;
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
    }
  };
});

'use strict';

angular.module('app').factory('Miner', function($rootScope, GameService) {
  var game = GameService.get();
  var nameCounter = 0;
  var Miner = function(isEnemy) {
    this.spawn = {
      x: game.world.randomX,
      y: game.world.randomY
    };
    this.isEnemy = isEnemy || false;
    

    var skin = this.isEnemy ? 'enemyMiner' : 'miner';

    var coin = game.rnd.integer % 4;
    switch(coin) {
    case 0:
      this.spawn.x = -32;
      this.span.y = game.world.randomY;
      break;
    case 1:
      this.spawn.x = game.world.width + 32;
      this.spany = game.world.randomY;
      break;
    case 2:
      this.spawn.x = game.world.randomX;
      this.spawn.y = -32;
      break;
    case 3:
      this.spawn.x = game.world.randomX;
      this.spawn.y = game.world.height + 32;
      break;
    }
    Phaser.Sprite.call(this, game, this.spawn.x, this.spawn.y, skin);
    this.anchor.setTo(0.5, 0.5);
    this.scale.setTo(GameService.getStat('globalScale'),GameService.getStat('globalScale'));
    this.body.collideWorldBounds = true;
    this.body.maxVelocity.x = 100;
    this.body.maxVelocity.y = 100;
    this.body.drag = {x: 100, y:100};
    this.bulletTime = 0;
    this.pulseTime = 0;
    this.name = (this.isEnemy ? 'enemy-miner-' : 'miner-') + nameCounter;
    this.target = null;
    this.rotationTween = null;
    this.laser = null;
    this.nameText = game.add.bitmapText(this.x, this.y, this.name, {font: '10px minecraftia', align: 'center'});
    this.nameText.anchor.setTo(0.5, 0.5);
    nameCounter++;
    game.add.existing(this);
    this.patrolTween = null;

    
  };

  Miner.prototype = Object.create(Phaser.Sprite.prototype);
  Miner.prototype.constructor = Miner;


  Miner.prototype.mine = function(asteroid) {
    asteroid.attachMiner(this);
  };
  
  Miner.prototype.miningComplete = function() {
    this.mining = false;
    this.laser.kill();
    this.target = null;
    console.debug('mining complete');
  };

  Miner.prototype.update = function() {
    var self = this;
    this.nameText.x = this.x;
    this.nameText.y = this.y - 16;
    this.scale.setTo(GameService.getStat('globalScale'),GameService.getStat('globalScale'));
    this.body.angularVelocity = 0;
    if(!this.mining && this.alive) {
      var closest = {
        asteroid: {}
      };
      game.asteroids.forEachAlive(function(asteroid) {
        if(!asteroid.hasAttachedMiner) {
          var d = game.physics.distanceBetween(self, asteroid);
          var chased = true;
          var chasingMiner = game.enemyMiners.iterate('chasing',asteroid.name, Phaser.Group.RETURN_CHILD) || game.miners.iterate('chasing',asteroid.name, Phaser.Group.RETURN_CHILD);
          var chasingMinerDistance = chasingMiner && chasingMiner.name !== self.name ? game.physics.distanceBetween(chasingMiner, asteroid) : null;
          if(!chasingMiner || chasingMiner.name === self.name || chasingMinerDistance > d) {
            chased = false;
          }
          if(!chased && (!closest.asteroid.distance || d < closest.asteroid.distance)) {
            closest.asteroid.distance = d;
            closest.asteroid.obj = asteroid;
          }
        }
      },true);


      if(closest.asteroid.obj ) {
        this.rotation = game.physics.angleBetween(this, closest.asteroid.obj);
        if (closest.asteroid.distance <= GameService.getStat('miningRange') * GameService.getStat('globalScale') && closest.asteroid.obj.targetable) {
          this.body.velocity.x = 0;
          this.body.velocity.y = 0;
          this.mining = true;
          this.target = closest.asteroid.obj;
          this.laser = this.isEnemy ? game.enemyLasers.getFirstDead() : game.lasers.getFirstDead();
          this.laser.x = this.x;
          this.laser.scale.setTo(GameService.getStat('globalScale'),GameService.getStat('globalScale'));
          this.laser.y = this.y;
          this.laser.rotation = this.rotation - Math.PI/2;
          this.laser.height = closest.asteroid.distance;
          this.laser.width = 1;
          this.laser.revive();
          closest.asteroid.obj.attachMiner(this);
        } else {
          if(this.patrolTween && this.patrolTween.isRunning) {
            this.patrolTween.stop();
            this.body.velocity.x = 0;
            this.body.velocity.y = 0;
          }
          game.physics.moveToObject(this, closest.asteroid.obj, GameService.getStat('minerAcceleration'));
          this.chasing = closest.asteroid.obj.name;
        }
      } else {
        this.patrol();
      }
    }
  };
  Miner.prototype.kill = function() {
    console.debug('killing miner');
    Phaser.Sprite.prototype.kill.call(this);
    this.nameText.destroy();
    if(this.laser) { this.laser.kill(); }
    if(this.target) { this.target.detachMiner(); }
    this.mining = false;
    this.chasing = null;
  };
  Miner.rotationTweenCallback = function() {
    this.pulse();
  };

  Miner.prototype.patrol = function() {
    var x,y;
    if(!this.patrolTween || !this.patrolTween.isRunning) {
      this.body.velocity.x = 0;
      this.body.velocity.y = 0;
      x = game.world.randomX;
      y = game.world.randomY;
      this.rotation = game.physics.angleToXY(this, x, y);
      this.patrolTween = game.add.tween(this).to({x: x, y: y}, 5000, Phaser.Easing.Linear.None, true);
    }
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
        { cost: 0, value: 64 },
        { cost: 10, value: 96 },
        { cost: 100, value: 144 },
        { cost: 1000, value: 216},
        { cost: 10000, value: 324 },
        { cost: 100000, value: 486 }
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
        { cost: 10, value: 5 },
        { cost: 100, value: 10 },
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