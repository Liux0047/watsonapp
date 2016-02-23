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
            templateUrl: "views/common/content.html",
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
            data: {pageTitle: 'Breakdown'},
            controller: breakdownController
        })
}
angular
    .module('watsonapp')
    .config(config)
    .run(function ($rootScope, $state) {
        $rootScope.$state = $state;
    });
