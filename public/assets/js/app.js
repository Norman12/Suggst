var suggstApp = angular.module('suggstApp', ['ngRoute', 'suggstFactories', 'suggstControllers']);

suggstApp.config(['$routeProvider',
  function ($routeProvider) {
        $routeProvider.
        when('/suggst', {
            templateUrl: 'assets/js/partials/main.html',
            controller: 'MainController'
        }).
        when('/', {
            templateUrl: 'assets/js/partials/login.html',
            controller: 'LoginController'
        }).
        otherwise({
            redirectTo: '/'
        });
  }]);