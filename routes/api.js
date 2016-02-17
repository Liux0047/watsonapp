/**
 * Created by Allen on 2/4/2016.
 */

var express = require('express');
var router = express.Router();
var https = require('https');

var API_KEY_1 = 'd2c38d1f5fe8ae7a528f8f01d1ca36c291e23282';
var API_KEY_2 = 'd8f8c787d46a28787e2119fff692e863d020d7da';
var API_KEY_3 = 'ebd3a423e07ddaae345c6421485d36ff1a0ced11';

var gateway = 'https://gateway-a.watsonplatform.net/calls/data/GetNews?outputMode=json&count=999999&';
var enriched = 'enriched.url.';
var enrichedTitle = 'enriched.url.enrichedTitle.';
var RELEVANCE_THRESHOLD = 0.8;

/* GET api listing. */
router.get('/keywords', function (req, res, next) {
    var options = {
        start: req.query.start,
        end: req.query.end,
        searchText: req.query.searchText
    };

    var responseData = {};

    doAjax(buildKeywordsUrl(options, API_KEY_1), function (result) {
        res.json(result);
    });
});


router.get('/ioc', function (req, res, next) {
    var options = {
        start: req.query.start,
        end: req.query.end,
        title: req.query.searchText
    };

    var responseCounter = 0;

    var responseData = {};

    doAjax(buildIOTUrl('positive', options, API_KEY_1), function (result) {
        responseData.positiveCounts = result;
        sendIOTResponse(++responseCounter, 3, res, responseData);
    });

    doAjax(buildIOTUrl('negative', options, API_KEY_2), function (result) {
        responseData.negativeCounts = result;
        sendIOTResponse(++responseCounter, 3, res, responseData);
    });

    doAjax(buildIOTUrl('neutral', options, API_KEY_3), function (result) {
        responseData.neutralCounts = result;
        sendIOTResponse(++responseCounter, 3, res, responseData);

    });
});

router.get('/relevant-correlations', function (req, res, next) {
    var options = {
        start: req.query.start,
        end: req.query.end,
        title: req.query.searchText
    };

    var relevantEntities = {};
    var sentimentsWrapper = {
        sentiments: []
    };

    doAjax(buildRelevantEntitiesUrl(options, API_KEY_1), function (response) {
        response = require('../public/sample-data/JPY-entity.json');
        var docs = response.result.docs;
        for (var i = 0; i < docs.length; i++) {
            var entities = docs[i].source.enriched.url.entities;
            for (var j = 0; j < entities.length; j++) {
                var entity = entities[j];
                if (entity.relevance > RELEVANCE_THRESHOLD) {
                    console.log("Relevant entity found: " + entity.text);
                    if (typeof relevantEntities[entity.text] != 'undefined') {
                        relevantEntities[entity.text] += entity.relevance;
                    } else {
                        relevantEntities[entity.text] = entity.relevance;
                    }
                }
            }
        }

        var counter = 0;
        for (var entityText in relevantEntities) {
            doAjax(buildSentimentTrendUrl(encodeURIComponent(entityText), API_KEY_2), function (response, entityText) {
                console.log("Querying for entity: " + entityText);
                response = require('../public/sample-data/boj-sentiment.json');
                if (response.status == 'OK') {
                    var docs = response.result.docs;
                    var sentimentScores = [];
                    var currentTime = docs[0].timestamp;
                    var score = 0;
                    var date = 60;
                    var numScoresThisDate = 0;
                    for (var i = 0; i < docs.length; i++) {
                        var entities = docs[i].source.enriched.url.enrichedTitle.entities;

                        for (var j = 0; j < entities.length; j++) {
                            var entity = entities[j];
                            if (entity.text == entityText) {
                                score += entity.sentiment.score;
                                numScoresThisDate++;
                                if (currentTime - docs[i].timestamp >= 24 * 3600) {

                                    sentimentScores.push({
                                        'date': date,
                                        'score': entity.sentiment.score / numScoresThisDate
                                    });

                                    currentTime = docs[i].timestamp;
                                    score = 0;
                                    date--;
                                    numScoresThisDate = 0;
                                }
                            }
                        }
                    }
                    sentimentsWrapper.sentiments.push({
                        "entityText": entityText,
                        "sentimentScores": sentimentScores,
                        "relevance": relevantEntities[entityText]
                    });
                    console.log('Counter: ' + counter + ' of ' + Object.keys(relevantEntities).length + ': ' + entityText);
                    if (++counter == Object.keys(relevantEntities).length) {
                        res.json(sentimentsWrapper);
                    }
                }

            }, entityText);
        }
    });
});

module.exports = router;


function doAjax(url, callback, callbackParams) {
    https.get(url, function (httpsRes) {
        console.log('Got response: ' + httpsRes.statusCode);
        var data = [];
        // consume response body
        httpsRes.on('data', function (chunk) {
            data.push(chunk);
        });
        httpsRes.on('end', function () {
            var result = JSON.parse(data.join(''));
            callback(result, callbackParams);
        });
    }).on('error', function (e) {
        console.log('Got error: ' + e.message);
        //res.send('Error');
    });
}


function buildIOTUrl(sentiment, options, apiKey) {
    var url = gateway + 'start=now-30d&end=now&timeSlice=1d&q.enriched.url.entities.entity=|text=' + options.searchText + ',type=company|&' +
        '&q.enriched.url.enrichedTitle.docSentiment=|type=' + sentiment + '|&' +
        'apikey=' + apiKey;
    return url;
}

function buildKeywordsUrl(options, apiKey) {
    var returnParams = enriched + 'keywords.keyword.text,' + enriched + 'keywords.keyword.sentiment.score,' + enriched + 'keywords.keyword.relevance,' +
        enriched + 'url,' + enriched + 'title';
    var url = gateway + 'start=now-30d&end=now&q.' + enriched + 'entities.entity=|text=' + options.searchText + ',type=company|&' +
        'return=' + returnParams + '&' +
        'apikey=' + apiKey;
    return url;
}

function buildRelevantEntitiesUrl(options, apiKey) {
    var url = gateway + 'start=now-60d&end=now' +
        'q.' + enrichedTitle + 'entities.entity.text=' + options.searchText + '&' +
        'return=' + enriched + 'entities.entity.text,' + enriched + 'entities.entity.relevance&' +
        'dedup=1&apikey=' + apiKey;
    return url;
}

function buildSentimentTrendUrl(entityText, apiKey) {
    var url = gateway + 'start=now-60d&end=now' +
        'q.' + enrichedTitle + 'entities.entity.text=' + entityText + '&' +
        'return=' + enrichedTitle + 'entities.entity.text,' + enrichedTitle + 'entities.entity.sentiment.score&' +
        'apikey=' + apiKey;
    return url;
}

function sendIOTResponse(counter, threshold, res, responseData) {
    if (counter >= threshold) {
        res.json(responseData);
    }
}



