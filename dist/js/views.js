angular.module('views', []).run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('/views/main.html',
    "\n" +
    "<div class=\"row\">\n" +
    "  <div class=\"col-md-3\">\n" +
    "    <div class=\"row\">\n" +
    "      <div class=\"col-md-12\">Max Asteroids: {{stats.maxAsteroids}}</div>\n" +
    "    </div>\n" +
    "    <div class=\"row\">\n" +
    "      <div class=\"col-md-12\">Money: {{stats.money}}</div>\n" +
    "    </div>\n" +
    "    <div ng-show=\"showMoreBulletUpgrades\" class=\"row\">\n" +
    "      <div class=\"col-md-2\">\n" +
    "        <h5>More Bullets</h5>\n" +
    "        <button type=\"button\" ng-click=\"purchaseMoreBullets(10,1)\" popover=\"More Bullets\" popover-trigger=\"mouseenter\" ng-disabled=\"stats.money &lt; 10\" class=\"btn btn-primary\">1</button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <div ng-show=\"showFasterBulletUpgrades\" class=\"row\">\n" +
    "      <div class=\"col-md-2\">\n" +
    "        <h5>Faster Bullets</h5>\n" +
    "        <button type=\"button\" ng-click=\"purchaseFasterBullets(10,1)\" popover=\"Faster Bullets\" popover-trigger=\"mouseenter\" ng-disabled=\"stats.money &lt; 10\" class=\"btn btn-primary\">1</button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <div ng-show=\"showShipRepairs\" class=\"row\">\n" +
    "      <div class=\"col-md-2\">\n" +
    "        <h5>Ship Repairs</h5>\n" +
    "        <button type=\"button\" ng-click=\"purchaseShipRepairs(20,1)\" popover=\"Fix Thrusters\" popover-trigger=\"mouseenter\" ng-disabled=\"stats.money &lt; 20\" class=\"btn btn-primary\">1</button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <div ng-show=\"showAsteroidUpgrades\" class=\"row\">\n" +
    "      <div class=\"col-md-2\">\n" +
    "        <h5>Asteroids</h5>\n" +
    "        <button type=\"button\" ng-click=\"purchaseAsteroidUpgrades(25,1)\" popover=\"Fix Thrusters\" popover-trigger=\"mouseenter\" ng-disabled=\"stats.money &lt; 25\" class=\"btn btn-primary\">1</button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <div class=\"col-md-9\">\n" +
    "    <div id=\"asteroidle-game\" class=\"game\"></div>\n" +
    "  </div>\n" +
    "</div>"
  );

}]);
