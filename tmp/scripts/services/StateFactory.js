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