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
    $('#top-search').keyup(function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            getIOC($http);
        }
    });
}

function keywordsController($scope, $http) {
    getKeywords($http);
    $('#top-search').keyup(function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            getKeywords($http);
        }
    });
}

function getIOC($http) {
    var input = $('#top-search').val();
    if (input.length) {

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

        $http.get("/api/ioc?searchText=" + input)
            .then(function (response) {
                options.series = [];
                response = response.data;
                if (response.positiveCounts.status == "OK") {
                    options.series.push({
                        name: 'Positvie',
                        data: response.positiveCounts.result.slices
                    });
                }

                if (response.neutralCounts.status == "OK") {
                    options.series.push({
                        name: 'Neutral',
                        data: response.neutralCounts.result.slices
                    });
                }

                if (response.negativeCounts.status == "OK") {
                    options.series.push({
                        name: 'Negative',
                        data: response.negativeCounts.result.slices
                    });
                }

                $('#container').highcharts(options);
            });
    }
}

function getKeywords($http) {
    var input = $('#top-search').val();
    if (input.length) {

        var options = {
            chart: {
                type: 'bubble',
                plotBorderWidth: 1,
                zoomType: 'xy'
            },

            legend: {
                enabled: false
            },

            title: {
                text: 'Related Keywords'
            },

            subtitle: {
                text: 'Source: <a href="http://www.euromonitor.com/">Euromonitor</a> and <a href="https://data.oecd.org/">OECD</a>'
            },

            xAxis: {
                title: {
                    text: 'Sentiment'
                }
            },

            yAxis: {
                startOnTick: false,
                endOnTick: false,
                title: {
                    text: 'Times mentioned'
                }
            },

            tooltip: {
                useHTML: true,
                headerFormat: '<table>',
                pointFormat: '<tr><th>Sentiment:</th><td>{point.x}</td></tr>' +
                '<tr><th>Mentioned:</th><td>{point.y} times</td></tr>' +
                '<tr><th>Avg Relevance:</th><td>{point.z}</td></tr>',
                footerFormat: '</table>',
                followPointer: true
            },

            plotOptions: {
                series: {
                    dataLabels: {
                        enabled: true,
                        format: '{point.name}'
                    }
                }
            }
        };

        $http.get("/api/keywords?searchText=" + input)
        //$http.get("/news.json")
            .then(function (response) {
                options.series = [];
                response = response.data;
                if (response.status == "OK") {
                    var data = processKeywordsData(response);
                    options.series.push({
                        data: data
                    });
                }
                console.debug(options.series.data);

                $('#container').highcharts(options);
            });
    }

}

function processKeywordsData(rawResponse) {
    rawResponse = rawResponse.result.docs;
    var keywordsWrapper = {};
    for (var i = 0; i < rawResponse.length; i++) {
        var entities = rawResponse[i].source.enriched.url.entities;
        for (var j = 0; j < entities.length; j++){
            var entity = entities[j];
            if (typeof keywordsWrapper[entity.text] != 'undefined') {
                keywordsWrapper[entity.text].count++;
                keywordsWrapper[entity.text].relevance += entity.relevance;
                keywordsWrapper[entity.text].sentimentScore += entity.sentiment.score;
            } else {
                keywordsWrapper[entity.text] = {
                    count: 1,
                    relevance: entity.relevance,
                    sentimentScore: entity.sentiment.score
                }
            }
        }
    }

    var result = [];
    for (var text in keywordsWrapper) {
        var keyword = keywordsWrapper[text];
        if (keyword.count > 0){
            result.push({
                x: keyword.sentimentScore / keyword.count,
                y: keyword.count,
                z: keyword.relevance / keyword.count,
                name: text
            });
        }
    }

    return result;

}