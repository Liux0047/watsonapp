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
    $('.select2').select2();
    $("input[id='range-in-days']").TouchSpin({
        min: 1,
        max: 60,
        buttondown_class: 'btn btn-white',
        buttonup_class: 'btn btn-white'

    });
    var updateLinks = function (links) {
        $scope.$apply(function () {
            $scope.links = links;
            console.log($scope.links);
        });
    }
    $('#keywords-search-btn').click(function (event) {
        getKeywords($http, updateLinks);

    });
}


function relevantCorrelationsController($scope, $http) {
    var input = $('#top-search').val();
    if (input.length) {
        $http.get("/api/relevant-correlations?searchText=" + input)
            .then(function (response) {
                console.log(response);
                $scope.sentimentData = response.data;

            });
    }
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

function getKeywords($http, updateLinks) {
    var entityName = $('#entity-name').val();
    var keywordsWrapper = {};

    if (entityName.length) {

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
                    text: 'Timestamp'
                }
            },

            yAxis: {
                startOnTick: false,
                endOnTick: false,
                title: {
                    text: 'Sentiment'
                }
            },

            tooltip: {
                useHTML: true,
                headerFormat: '<table>',
                pointFormat: '<tr><th>{point.name}</th></tr>' +
                '<tr><th>Time:</th><td>{point.date}</td></tr>' +
                '<tr><th>Sentiment:</th><td>{point.y} </td></tr>' +
                '<tr><th>Relevance:</th><td>{point.z}</td></tr>',
                footerFormat: '</table>',
                followPointer: true
            },

            plotOptions: {
                series: {
                    dataLabels: {
                        enabled: true,
                        format: '{point.name}'
                    },
                    point: {
                        events: {
                            click: function () {
                                updateLinks(keywordsWrapper[this.name].links);
                                $('#myModal').modal('show');
                            }
                        }
                    }
                }
            }
        };

        $http({
            method: 'GET',
            url: '/api/keywords',
            params: {
                entityName: entityName,
                entityType: $('#entity-type').val(),
                rangeInDays: $('#range-in-days').val()
            }
        }).then(function (response) {
            options.series = [];
            response = response.data;
            if (response.status == "OK") {
                var data = processKeywordsData(response, keywordsWrapper);
                options.series.push({
                    data: data
                });
            }
            $('#keywords-container').show();
            $('#keywords-chart').highcharts(options);
        });
    }

}

function processKeywordsData(rawResponse, keywordsWrapper) {
    var docs = rawResponse.result.docs;
    for (var i = 0; i < docs.length; i++) {
        if (Object.keys(docs[i].source).length) {
            var keywords = docs[i].source.enriched.url.keywords;
            for (var j = 0; j < keywords.length; j++) {
                var keyword = keywords[j];
                if (keyword.relevance >= 0.9) {
                    if (typeof keywordsWrapper[keyword.text] != 'undefined') {
                        keywordsWrapper[keyword.text].count++;
                        keywordsWrapper[keyword.text].relevance += keyword.relevance;
                        keywordsWrapper[keyword.text].sentimentScore += keyword.sentiment.score;
                        keywordsWrapper[keyword.text].timestamp = docs[i].timestamp;
                        keywordsWrapper[keyword.text].links.push(
                            {
                                title: docs[i].source.enriched.url.title,
                                url: docs[i].source.enriched.url.url
                            }
                        );
                    } else {
                        keywordsWrapper[keyword.text] = {
                            count: 1,
                            relevance: keyword.relevance,
                            sentimentScore: keyword.sentiment.score,
                            timestamp: docs[i].timestamp,
                            links: [{
                                title: docs[i].source.enriched.url.title,
                                url: docs[i].source.enriched.url.url
                            }]
                        }
                    }
                }

            }
        }
    }

    var result = [];
    for (var text in keywordsWrapper) {
        var keyword = keywordsWrapper[text];
        if (keyword.relevance > 3) {
            result.push({
                x: ((new Date()).getTime() / 1000 - keyword.timestamp) / (24 * 3600),
                y: keyword.sentimentScore / keyword.count,
                z: keyword.relevance,
                name: text,
                date: (new Date(keyword.timestamp)).toDateString()
            });
        }
    }

    return result;
}