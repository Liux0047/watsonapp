/**
 * INSPINIA - Responsive Admin Theme
 *
 * Inspinia theme use AngularUI Router to manage routing and views
 * Each view are defined as state.
 * Initial there are written state for all view in theme.
 *
 */
function config($stateProvider, $urlRouterProvider, $ocLazyLoadProvider) {
    $urlRouterProvider.otherwise("/index/keywords");

    $ocLazyLoadProvider.config({
        // Set to true if you want to see what and when is dynamically loaded
        debug: false
    });

    $stateProvider

        .state('index', {
            abstract: true,
            url: "/index",
            templateUrl: "views/common/content.html"
        })
        .state('index.sentiment', {
            url: "/sentiment",
            templateUrl: "views/sentiment.html",
            data: {pageTitle: 'Sentiment Analysis'},
            controller: sentimentController
        })
        .state('index.keywords', {
            url: "/keywords",
            templateUrl: "views/keywords.html",
            data: {pageTitle: 'Related Keywords'},
            controller: keywordsController
        })
        .state('index.breakdown', {
            url: "/breakdown",
            templateUrl: "views/breakdown.html",
            data: {pageTitle: 'Factor Breakdown'},
            controller: breakdownController
        })
        .state('index.headlines', {
            url: "/headlines",
            templateUrl: "views/headlines.html",
            data: {pageTitle: 'Trendy Headlines'},
            controller: headlinesController
        })
        .state('index.mentions', {
            url: "/mentions",
            templateUrl: "views/mentions.html",
            data: {pageTitle: 'Recent Mentions'},
            controller: mentionsController
        })
}
angular
    .module('watsonapp')
    .config(config)
    .filter('capitalize', function () {
        return function (input, scope) {
            if (input != null)
                input = input.toLowerCase();
            return input.substring(0, 1).toUpperCase() + input.substring(1);
        }
    })
    .run(function ($rootScope, $state) {
        $rootScope.$state = $state;
    });
