/**
 * INSPINIA - Responsive Admin Theme
 *
 */
(function () {
    angular.module('watsonapp', [
        'ui.router',                    // Routing
        'oc.lazyLoad',                  // ocLazyLoad
        'ui.bootstrap',                 // Ui Bootstrap
    ])
})();

var url = (window.location != window.parent.location)
            ? document.referrer
            : document.location;
alert(url);