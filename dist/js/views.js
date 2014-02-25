angular.module('views', []).run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('/views/main.html',
    "\n" +
    "<div class=\"row\">\n" +
    "  <div class=\"col-md-3\">\n" +
    "    <div class=\"row\">\n" +
    "      <div class=\"col-md-12\">Money: {{stats.money.value}}</div>\n" +
    "    </div>\n" +
    "    <h4>Upgrades</h4>\n" +
    "    <div ng-repeat=\"(upgradeKey, upgrade) in upgrades\" class=\"row\">\n" +
    "      <div class=\"col-md-12\">\n" +
    "        <h5>{{upgrade.label}}:<small> Current Level: {{stats[upgradeKey].level}}</small></h5>\n" +
    "        <div ng-repeat=\"(levelNumber, level) in upgrade.levels\" class=\"col-md-1\">       \n" +
    "          <button type=\"button\" ng-click=\"purchaseUpgrade(upgradeKey,levelNumber)\" ng-disabled=\"stats.money.value &lt; level.cost || stats[upgradeKey].level &lt;= levelNumber\" ng-hide=\"levelNumber == 0\" class=\"btn btn-primary btn-xs\">{{levelNumber}}</button>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <h4>Purchasables</h4>\n" +
    "    <div ng-repeat=\"item in purchasables\" class=\"row\">\n" +
    "      <div class=\"col-md-12\">\n" +
    "        <h5>{{item.label}}</h5>\n" +
    "        <button type=\"button\" ng-click=\"purchaseItem(item.stat)\" ng-disabled=\"stats.money.value &lt; item.cost\" class=\"btn btn-primary btn-xs\">+</button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <div class=\"col-md-9\">\n" +
    "    <div id=\"asteroidle-game\" class=\"game\"></div>\n" +
    "  </div>\n" +
    "</div>"
  );

}]);
