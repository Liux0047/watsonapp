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


function sentimentController($http, assetClassService) {
    getSentiment($http, assetClassService.getAssetClass());
    /*
     $('#top-search').keyup(function (event) {
     if (event.keyCode == 13) {
     event.preventDefault();
     getSentiment($http);
     }
     });
     */
}

function keywordsController($scope, $http, $location, assetClassService) {
    var assetClass = ($location.search()).assetClass;
    assetClassService.setAssetClass(assetClass);
    var updateLinks = function (links) {
        $scope.$apply(function () {
            $scope.links = links;
            console.log($scope.links);
        });
    }
    getKeywords($http, updateLinks, assetClass);
}


function breakdownController($http, assetClassService) {
    getBreakdown($http, assetClassService);
}

function getSentiment($http, assetClass) {
    var input = assetClass;
    if (input.length) {

        var options = {
            title: {
                text: 'Sentiment Analysis',
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
                    text: 'Date time'
                },
                type: 'datetime',
                dateTimeLabelFormats: {
                    day: '%e of %b'
                }
            },
            yAxis: {
                title: {
                    text: null
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

        $http.get("/api/sentiment?searchText=" + input)
            .then(function (response) {
                options.series = [];
                response = response.data;
                if (response.positiveCounts.status == "OK") {
                    options.series.push({
                        name: 'Positive',
                        data: response.positiveCounts.result.slices,
                        pointStart: (new Date()).getTime() - 24 * 60 * 3600,
                        pointInterval: 24 * 3600 * 1000 // one day
                    });
                }

                if (response.negativeCounts.status == "OK") {
                    options.series.push({
                        name: 'Negative',
                        data: response.negativeCounts.result.slices,
                        pointStart: (new Date()).getTime() - 24 * 60 * 3600,
                        pointInterval: 24 * 3600 * 1000 // one day
                    });
                }

                $('#sentiment-container').highcharts(options);
            });
    }
}

function getKeywords($http, updateLinks, assetClass) {
    var entityName = assetClass;
    var entitiesWrapper = {};

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
                },
                type: 'datetime',
                dateTimeLabelFormats: {
                    day: '%e of %b'
                }
            },

            yAxis: {
                startOnTick: false,
                endOnTick: false,
                title: {
                    text: null
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
                                updateLinks(entitiesWrapper[this.name].links);
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
                entityType: null,
                rangeInDays: 30
            }
        }).then(function (response) {
            options.series = [];
            response = response.data;
            if (response.status == "OK") {
                var data = processKeywordsData(response, entitiesWrapper);
                options.series.push({
                    data: data
                });
            }
            $('#keywords-container').show();
            $('#keywords-chart').highcharts(options);
        });
    }

}

function processKeywordsData(rawResponse, entitiesWrapper) {
    var docs = rawResponse.result.docs;
    for (var i = 0; i < docs.length; i++) {
        if (Object.keys(docs[i].source).length) {
            var entities = docs[i].source.enriched.url.entities;
            for (var j = 0; j < entities.length; j++) {
                var entity = entities[j];
                if (entity.relevance >= 0.9) {
                    if (typeof entitiesWrapper[entity.text] != 'undefined') {
                        entitiesWrapper[entity.text].count++;
                        entitiesWrapper[entity.text].relevance += entity.relevance;
                        entitiesWrapper[entity.text].sentimentScore += entity.sentiment.score;
                        entitiesWrapper[entity.text].timestamp = docs[i].timestamp;
                        entitiesWrapper[entity.text].links.push(
                            {
                                title: docs[i].source.enriched.url.title,
                                url: docs[i].source.enriched.url.url
                            }
                        );
                    } else {
                        entitiesWrapper[entity.text] = {
                            count: 1,
                            relevance: entity.relevance,
                            sentimentScore: entity.sentiment.score,
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
    for (var text in entitiesWrapper) {
        var keyword = entitiesWrapper[text];
        if (keyword.relevance > 0.5) {
            result.push({
                x: keyword.timestamp * 1000,
                y: keyword.sentimentScore / keyword.count,
                z: keyword.relevance,
                name: text,
                date: (new Date(keyword.timestamp * 1000)).toDateString()
            });
        }
    }

    return result;
}


function getBreakdown($http, assetClassService) {

    var options = {
        title: {
            text: 'Breakdown Sentiment Analysis',
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
                text: 'Date time'
            },
            type: 'datetime',
            dateTimeLabelFormats: {
                day: '%e of %b'
            }
        },
        yAxis: {
            title: {
                text: null
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

    $http({
        method: 'GET',
        url: '/api/breakdown',
        params: {
            entries: assetClassService.getAssetClassBreakdown()
        }
    }).then(function (response) {
        options.series = processBreakdownData(response.data);
        $('#breakdown-container').highcharts(options);
    });

}


function processBreakdownData(response) {
    var entries = response.entries;
    var series = [];
    var calculated = [];

    for (var i = 0; i < entries.length; i++) {
        var entryName = entries[i].entryName;
        if (calculated.indexOf(entryName) == -1) {
            var counts = [];
            for (var j = 0; j < entries.length; j++) {
                if (entries[j].entryName == entryName && i != j) {
                    for (var z = 0; z < entries[j].counts.length; z++) {
                        if (entries[j].sentiment == 'positive') {
                            counts[z] = Math.log((entries[j].counts[z] + 1) / (entries[i].counts[z] + 1));
                        } else {
                            counts[z] = Math.log((entries[i].counts[z] + 1) / (entries[j].counts[z] + 1));
                        }

                    }
                }
            }

            calculated.push(entryName);

            series.push({
                name: entryName,
                data: counts
            });

        }


    }
    return series;

}