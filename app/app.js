var app = angular.module('app',['ui.bootstrap','ui','views','ngRoute','LocalStorageModule']);

app.config(function($routeProvider) {
  console.debug('Setting up routes')
  $routeProvider.when('/', {
    templateUrl: '/views/main.html',
    controller: 'MainCtrl'
  });
});
