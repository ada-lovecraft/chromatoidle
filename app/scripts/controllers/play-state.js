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