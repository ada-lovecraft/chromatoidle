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