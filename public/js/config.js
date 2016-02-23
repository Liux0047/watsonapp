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
        .state('index.interest-over-time', {
            url: "/interest-over-time",
            templateUrl: "views/interest-over-time.html",
            data: {pageTitle: 'Interes Over Time'},
            controller: IOTController
        })
        .state('index.keywords', {
            url: "/keywords",
            templateUrl: "views/keywords.html",
            data: {pageTitle: 'Related Keywords'},
            controller: keywordsController
        })
        .state('index.relevant-correlations', {
            url: "/relevant-correlations",
            templateUrl: "views/relevant-correlations.html",
            data: {pageTitle: 'Relevant Correlations'},
            controller: relevantCorrelationsController
        })
}
angular
    .module('watsonapp')
    .config(config)
    .run(function ($rootScope, $state) {
        $rootScope.$state = $state;
    });
