var app = angular.module('app',['ui.bootstrap','ui','views','ngRoute','LocalStorageModule']);

app.config(function($routeProvider) {
  console.debug('Setting up routes')
  $routeProvider.when('/', {
    templateUrl: '/views/main.html',
    controller: 'MainCtrl'
  });
});

angular.module('app').controller('BootStateCtrl', function($scope, $log, GameService, StateFactory) {
  $log.debug('bootState');
  var game = GameService.get();
  var state = new StateFactory();
  var ready = false;

  state.preload = function() {
    console.debug('loading....');
    game.load.onLoadComplete.addOnce(state.onLoadComplete, state);
    game.load.image('ship', 'img/player.png');
    game.load.image('bullet', 'img/bullet.png');
    game.load.image('asteroid', 'img/asteroid.png');
    game.load.image('money', 'img/money.png');

  };

  state.create = function() {
    
  }

  state.update = function() {
    if (!!ready) {
      GameService.switchState('play');
    }
  }

  state.onLoadComplete = function() {
    ready = true;
    console.debug('loaded...');
  }

  return state;

});
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
angular.module('app').controller('PlayStateCtrl', function($scope, $rootScope, $controller, GameService, StateFactory, AsteroidFactory, ShipFactory, MoneyFactory) {
  var game = GameService.get();
  var state = new StateFactory();
  console.debug('scope:', $scope);


  state.create = function() {
    $scope.player = new ShipFactory();
    $scope.player.immovable = true;

    $scope.asteroids = game.asteroids = game.add.group();
    $scope.asteroids.setAll('anchor',0.5, 0.5);
    $scope.asteroids.setAll('outOfBoundsKill', true);

    $scope.money = game.money = game.add.group();

    $scope.bullets = game.bullets = game.add.group();
    $scope.bullets.createMultiple(100, 'bullet');
    $scope.bullets.setAll('anchor',0.5, 0.5);
    $scope.bullets.setAll('outOfBoundsKill', true);
    $scope.respawnTimer = 0;
    
  };

  state.update = function() {
    var aliveCount = 0;
    if(!$scope.player.alive) {
      $rootScope.$broadcast('respawnCountdown', ($scope.respawnTimer - game.time.now), GameService.getStat('respawnRate') )
      if(game.time.now >= $scope.respawnTimer) {
        $scope.player.respawn();
        $rootScope.$broadcast('respawnFinish');
      }
    }

    $scope.asteroids.forEachAlive(function(asteroid) {
      if(asteroid.health > 25) {
        aliveCount++;
      }
    }, this);
    if (aliveCount < GameService.getStats().maxAsteroids) {
      var asteroid = new AsteroidFactory();
      $scope.asteroids.add(asteroid);
    }
    game.physics.collide($scope.asteroids);
    game.physics.collide($scope.money);
    game.physics.collide($scope.asteroids, $scope.money);
    game.physics.collide($scope.asteroids, $scope.bullets, state.asteroidCollideHandler);
    game.physics.overlap($scope.player, $scope.money, state.moneyCollideHandler);
    game.physics.overlap($scope.player, $scope.asteroids, state.deathHandler);
  };

  state.deathHandler = function(player, asteroid) {
    $scope.player.kill();
    var bullet = $scope.bullets.getFirstDead();
    bullet.revive();
    state.asteroidCollideHandler(asteroid, bullet);
    $scope.respawnTimer = game.time.now + GameService.getStat('respawnRate');
    console.debug(game.time.now, $scope.respawnTimer);
  }

  state.asteroidCollideHandler = function(asteroid, bullet) {
    bullet.kill();
    if (asteroid.health - 25 <= 0) {
      var money = new MoneyFactory(asteroid.body.x, asteroid.body.y, 1);
      asteroid.kill();
      $scope.money.add(money);
    }
    else {
      var asterA = new AsteroidFactory(asteroid, asteroid.health / 2, false, asteroid.scale.x / 2);
      var asterB = new AsteroidFactory(asteroid, asteroid.health / 2, true, asteroid.scale.x / 2);
      asteroid.kill();
      $scope.asteroids.add(asterA);
      $scope.asteroids.add(asterB);

    }
  }

  state.moneyCollideHandler = function(player, money) {
    GameService.updateStats({money: GameService.getStat('money') + money.value});
    money.kill();
  }

  state.render = function() {
  }

  /* Debug Info */
  $scope.$on('closestAsteroid', function(evt, asteroid) {
    $scope.closestAsteroid = asteroid.asteroidObj;
  })

  return state;
});
angular.module('app').factory('AsteroidFactory', function(GameService) {
  var game = GameService.get()
  var nameCounter = 0;
  var Asteroid = function(clone,hp, invertVelocities, scale) {
    var x = 0,
        y = 0,
        self = this;

    Phaser.Sprite.call(this, game, 0,0, 'asteroid');
    this.toX, this.toY, this.startX, this.startY;
    this.coin = game.rnd.integer() % 4
    this.coin = 0;



    scale = scale || 1;

    if(!clone) {
      switch(this.coin) {
        case 0:
          this.startX = game.world.randomX;
          this.startY = 0;
          
          break;
        case 1:
          this.startX = game.world.randomX;
          this.startY = game.world.height;
          break;
        case 2:
          this.startY = game.world.randomY;
          break;
        case 3:
          this.startX = game.world.width;
          this.startY = game.world.randomY;
          break;

      }
    }
    else {
      var mult = 1;
      if(invertVelocities)
        mult = -1
      this.startX = clone.x;
      this.startY = clone.y;
    }

    this.rotateSpeed = game.rnd.integerInRange(1,50) / 10;
    
    this.anchor.setTo(0.5,0.5);
    this.scale.setTo(scale, scale);
    this.health = hp || 100;
    this.body.x = this.startX;
    this.body.y = this.startY;
    this.body.maxVelocity.x = 50;
    this.body.maxVelocity.y = 50;

    this.body.collideWorldBounds = true;
   
    this.body.velocity.x = game.rnd.integerInRange(-100,100);
    this.body.velocity.y = game.rnd.integerInRange(-100,100);
    
    this.body.bounce.setTo(1,1);


    this.name = 'asteroid-' + nameCounter;
    nameCounter++;

  }

  Asteroid.prototype = Object.create(Phaser.Sprite.prototype)
  Asteroid.prototype.constructor = Asteroid;
  

  Asteroid.prototype.create = function() {


  }
  Asteroid.prototype.update = function() {
    //this.angle += this.rotateSpeed;
  };





  return Asteroid;
});
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

angular.module('app').factory('ShipFactory', function($rootScope, GameService) {
  var game = GameService.get()
  var nameCounter = 0;
  var Ship = function(x, y) {
    this.spawn = {
      x: x || game.width/2,
      y: y || game.height/2
    };
    
    Phaser.Sprite.call(this, game, this.spawn.x, this.spawn.y, 'ship');
    this.anchor.setTo(0.5, 0.5);
    this.body.collideWorldBounds = true;
    this.body.maxVelocity.x = 100;
    this.body.maxVelocity.y = 100
    this.body.drag = {x: 100, y:100}
    this.bulletTime = 0;
    this.pulseTime = 0;
    this.name = 'ship-' + nameCounter;
    this.target = {};
    this.rotationTween = null;
    nameCounter++;
    game.add.existing(this);
    
  };

  Ship.prototype = Object.create(Phaser.Sprite.prototype);
  Ship.prototype.constructor = Ship;

  Ship.prototype.pulse = function() { 
    if(game.time.now > this.pulseTime) {
      this.body.velocity.x += Math.sin(this.rotation);
      this.body.velocity.y += -Math.cos(this.rotation);
    }
  }  

  Ship.prototype.fire = function() { 
    if (game.time.now > this.bulletTime && this.alive) {
        this.bulletTime  = game.time.now + GameService.getStat('bulletInterval');  
        var bullet = game.bullets.getFirstDead();
        bullet.revive();
        bullet.x = this.x;
        bullet.y = this.y;
        bullet.body.velocity.x = Math.sin(this.rotation) * GameService.getStat('bulletSpeed');
        bullet.body.velocity.y = -Math.cos(this.rotation) * GameService.getStat('bulletSpeed');
      
      }
  }

  Ship.prototype.respawn = function() {
    this.x = this.spawn.x;
    this.y = this.spawn.y;
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
    this.revive();
  }

  Ship.prototype.update = function() {
    var self = this;

    this.body.angularVelocity = 0;

    if(this.game.input.keyboard.isDown(Phaser.Keyboard.W)) {
      if(game.time.now > this.pulseTime) {
        this.pulse();  
        this.pulseTime = game.time.now + GameService.getStat('pulseInterval');
      }
      
      
    }
    if(this.game.input.keyboard.isDown(Phaser.Keyboard.A)) {
      this.angle -= .1
    }

    if(this.game.input.keyboard.isDown(Phaser.Keyboard.D)) {
      this.angle += .1
    }

    if(this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
      this.fire();
      
    }

    
      var closest = {
        asteroid: {},
        money: {}
      };
      game.asteroids.forEachAlive(function(asteroid) { 
        var d = game.physics.distanceBetween(self, asteroid);
        if( ! closest.asteroid.distance || d < closest.asteroid.distance) { 
          closest.asteroid.distance = d;
          closest.asteroid.obj = asteroid;
        }
      });
      game.money.forEachAlive(function(money) { 
        var d = game.physics.distanceBetween(self, money);
        if(! closest.money.distance || d < closest.money.distance) { 
          closest.money.distance = d;
          closest.money.obj = money;
        }
      });

      if(closest.asteroid.obj && closest.asteroid.distance <= GameService.getStat('sensorRange')) {
        this.target.obj = null;
        this.rotation = game.physics.angleBetween(this, closest.asteroid.obj) + (Math.PI/2) * 3;
        this.pulse();
      }
      else if(closest.asteroid.obj) {
        this.rotation = game.physics.angleBetween(this, closest.asteroid.obj) + Math.PI/2;
      } 
      

      if(closest.money.obj && closest.money.distance < closest.asteroid.distance) {
        game.physics.accelerateToObject(self, closest.money.obj,GameService.getStat('shipAcceleration') );
      }
      else {
        if((this.body.x > this.spawn.x + 25 || this.body.x < this.spawn.x - 25) || (this.body.y > this.spawn.y + 25 || this.body.y < this.spawn.y - 25)) {
          game.physics.accelerateToXY(self, self.spawn.x, self.spawn.y, GameService.getStat('shipAcceleration'));
        }
      }

      this.fire();

      if(this.target.gatherTime && this.target.gatherTime >= game.time.now) {
        this.target.obj = null;
        this.target.gatherTime = null;
      }
      game.physics.overlap(this,this.target.obj, function() {
        self.target.obj = null;
      });
  };
  
  Ship.rotationTweenCallback = function() {
    this.pulse();
  };

  

  return Ship;
});
angular.module('app').factory('StateFactory', function() {
  var State = function() {

  }
  State.prototype = {
    preload: function() {},
    create: function() {},
    update: function() {},
    onLoadComplete: function() {}
  }
  return State;
});