/**
 * Created by Allen on 2/4/2016.
 */

var express = require('express');
var router = express.Router();
var https = require('https');
try {
var HttpsProxyAgent = require('https-proxy-agent');    
} catch (e){
    console.log('env: https-proxy-agent does not exits');
}
var urlApi = require('url');

var CONFIG = {
    PROXY: '',
    WATSON_API_KEY_1: '471ccf386c13f586b9872de945f4834b390a0807',
    WATSON_API_KEY_2: '3627a5a76ac122f8647f9f796e0e287b967417ab',
    WATSON_API_KEY_3: 'ebd3a423e07ddaae345c6421485d36ff1a0ced11'
};

try {
    var localConfig = require('./local-config.json');
    for(var k in localConfig) {
        if(CONFIG.hasOwnProperty(k)) {
            console.log('Replacing ' + k + ' from[' + CONFIG[k] + ' ] to [' + localConfig[k] + ']');
            CONFIG[k] = localConfig[k];
        }
    }
} catch(e) {
    console.log('local configuration does not exist, ignore.', e);
}

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

    doAjax(buildKeywordsUrl(options, CONFIG.WATSON_API_KEY_1), function (result) {
        res.json(result);
    });
});


router.get('/sentiment', function (req, res, next) {
    var options = {
        start: req.query.start,
        end: req.query.end,
        searchText: req.query.searchText
    };

    var responseCounter = 0;
    var requestNum = 3

    var responseData = {};

    doAjax(buildSentimentUrl('positive', options, CONFIG.WATSON_API_KEY_1), function (result) {
        responseData.positiveCounts = result;
        sendSentimentResponse(++responseCounter, requestNum, res, responseData);
    });
    
    doAjax(buildSentimentUrl('negative', options, CONFIG.WATSON_API_KEY_1), function (result) {
        responseData.negativeCounts = result;
        sendSentimentResponse(++responseCounter, requestNum, res, responseData);
    });

    doAjax(buildSentimentUrl('neutral', options, CONFIG.WATSON_API_KEY_1), function (result) {
        responseData.neutralCounts = result;
        sendSentimentResponse(++responseCounter, requestNum, res, responseData);

    });
});

router.get('/relevant-correlations', function (req, res, next) {
    var options = {
        start: req.query.start,
        end: req.query.end,
        title: req.query.searchText
    };

    var entitiesWrapper = {};

    doAjax(buildRelevantEntitiesUrl(options, CONFIG.WATSON_API_KEY_2), function (response) {

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
    var opts = urlApi.parse(url);
    if(CONFIG.PROXY !== '') {
        var agent = new HttpsProxyAgent(CONFIG.PROXY);
        opts.agent = agent;
    }
    https.get(opts, function (httpsRes) {
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


function buildSentimentUrl(sentiment, options, apiKey) {
    var url = gateway + 'start=now-60d&end=now&timeSlice=1d&' + 
        'q.enriched.url.entities.entity=|text=' + options.searchText + ',sentiment.type='+ sentiment + '|&' +
        'apikey=' + apiKey;
        console.log(url);
    return url;
}

function buildKeywordsUrl(options, apiKey) {
    var type = '';
    if (typeof options.entityType != 'undefined' && options.entityType.length){
        type = ',type='+ options.entityType;
    }
    var returnParams = enriched + 'entities.entity.text,' + enriched + 'entities.entity.sentiment.score,' + enriched + 'entities.entity.relevance,' +
        enriched + 'url,' + enriched + 'title';
    var url = gatewayWithCount + 'start=now-' + options.rangeInDays + 'd&end=now&q.' + enriched +
        'entities.entity=|text=' + options.entityName + type + ',relevance=>0.8|&' +
        'q.enriched.url.taxonomy.taxonomy_.label=[business%20and%20industrial^finance]&' +
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

function sendSentimentResponse(counter, threshold, res, responseData) {
    if (counter >= threshold) {
        res.json(responseData);
    }
}



