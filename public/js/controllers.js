/**
 * INSPINIA - Responsive Admin Theme
 *
 */

/**
 * MainCtrl - controller
 */
function MainCtrl() {

    this.userName = 'Example user';
    this.helloText = 'Welcome in SeedProject';
    this.descriptionText = 'It is an application skeleton for a typical AngularJS web app. You can use it to quickly bootstrap your angular webapp projects and dev environment for these projects.';

};


angular
    .module('watsonapp')
    .controller('MainCtrl', MainCtrl);


function IOTController($scope, $http) {
    getIOC($http);
}

function getIOC ($http) {
    var options = {
        title: {
            text: 'Interest Over Time',
            x: -20 //center
        },
        subtitle: {
            text: 'Source: ibm.com',
            x: -20
        },
        chart: {
            zoomType: 'x'
        },
        xAxis: {
            title: {
                text: 'time (day)'
            },
        },
        yAxis: {
            title: {
                text: 'Mentions'
            }
        },
        tooltip: {
            valueSuffix: ' times'
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            borderWidth: 0
        }
    };

    $http.get("/api/ioc?searchText=" + $('#top-search').val())
        .then(function (response) {
            options.series = [];
            response = response.data;
            if (response.positiveCounts.status == "OK"){
                options.series.push({
                    name:'Positvie',
                    data: response.positiveCounts.result.slices
                });
            }

            if (response.neutralCounts.status == "OK"){
                options.series.push({
                    name:'Neutral',
                    data: response.neutralCounts.result.slices
                });
            }

            if (response.negativeCounts.status == "OK"){
                options.series.push({
                    name:'Negative',
                    data: response.negativeCounts.result.slices
                });
            }

            $('#container').highcharts(options);
        });

}