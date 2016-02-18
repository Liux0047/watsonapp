/**
 * Created by Allen on 2/4/2016.
 */

var express = require('express');
var router = express.Router();
var https = require('https');

var API_KEY_1 = '3627a5a76ac122f8647f9f796e0e287b967417ab';
var API_KEY_2 = 'd8f8c787d46a28787e2119fff692e863d020d7da';
var API_KEY_3 = 'ebd3a423e07ddaae345c6421485d36ff1a0ced11';


var gateway = 'https://gateway-a.watsonplatform.net/calls/data/GetNews?outputMode=json&';
var gatewayWithCount = gateway + 'count=999999&';
var enriched = 'enriched.url.';
var enrichedTitle = 'enriched.url.enrichedTitle.';
var RELEVANCE_THRESHOLD = 0.5;

/* GET api listing. */
router.get('/keywords', function (req, res, next) {
    var options = {
        entityName: req.query.entityName,
        entityType: req.query.entityType,
        rangeInDays: req.query.rangeInDays
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

    var entitiesWrapper = {};

    doAjax(buildRelevantEntitiesUrl(options, API_KEY_1), function (response) {

        var counter = 0;
        response = require('../public/JPY-entity.json');

        if (response.status == 'OK') {
            var docs = response.result.docs;
            var sentimentScores = [];
            for (var i = 0; i < docs.length; i++) {
                var entities = docs[i].source.enriched.url.entities;

                for (var j = 0; j < entities.length; j++) {
                    var entity = entities[j];
                    if (entity.relevance >= RELEVANCE_THRESHOLD) {
                        if (typeof entitiesWrapper[entity.text] != 'undefined') {
                            entitiesWrapper[entity.text].sentimentScores.push({
                                'timestamp': docs[i].timestamp,
                                'score': entity.sentiment.score
                            });
                            entitiesWrapper[entity.text].relevance += entity.relevance;
                        } else {
                            entitiesWrapper[entity.text] = {
                                'text': entity.text,
                                'sentimentScores': [{
                                    'timestamp': docs[i].timestamp,
                                    'score': entity.sentiment.score
                                }],
                                'relevance': entity.relevance
                            }
                        }
                    }

                }
            }
            res.json(entitiesWrapper);
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
    var url = gatewayWithCount + 'start=now-30d&end=now&timeSlice=1d&q.enriched.url.entities.entity=|text=' + options.searchText + ',type=company|&' +
        '&q.enriched.url.enrichedTitle.docSentiment=|type=' + sentiment + '|&' +
        'apikey=' + apiKey;
    return url;
}

function buildKeywordsUrl(options, apiKey) {
    var type = '';
    if (typeof options.entityType != 'undefined' && options.entityType.length){
        type = ',type='+ options.entityType;
    }
    var returnParams = enriched + 'keywords.keyword.text,' + enriched + 'keywords.keyword.sentiment.score,' + enriched + 'keywords.keyword.relevance,' +
        enriched + 'url,' + enriched + 'title';
    var url = gatewayWithCount + 'start=now-' + options.rangeInDays + 'd&end=now&q.' + enriched +
        'entities.entity=|text=' + options.entityName + type + ',relevance=>0.6|&' +
        'return=' + returnParams + '&' +
        'dedup=1&apikey=' + apiKey;
    return url;
}

function buildRelevantEntitiesUrl(options, apiKey) {
    var url = gatewayWithCount + 'start=now-60d&end=now' +
        'q.' + enrichedTitle + 'entities.entity.text=' + options.searchText + '&' +
        'return=' + enriched + 'entities.entity.text,' + enriched + 'entities.entity.relevance&' +
        'dedup=1&apikey=' + apiKey;
    return url;
}

function sendIOTResponse(counter, threshold, res, responseData) {
    if (counter >= threshold) {
        res.json(responseData);
    }
}



