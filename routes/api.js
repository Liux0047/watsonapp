/**
 * Created by Allen on 2/4/2016.
 */

var express = require('express');
var router = express.Router();
var https = require('https');
try {
    var HttpsProxyAgent = require('https-proxy-agent');
} catch (e) {
    console.log('env: https-proxy-agent does not exits');
}
var urlApi = require('url');

var CONFIG = {
    PROXY: '',
    WATSON_API_KEY: '471ccf386c13f586b9872de945f4834b390a0807'
    //WATSON_API_KEY_2: '3627a5a76ac122f8647f9f796e0e287b967417ab',
    //WATSON_API_KEY_3: 'ebd3a423e07ddaae345c6421485d36ff1a0ced11'
};

try {
    var localConfig = require('./local-config.json');
    for (var k in localConfig) {
        if (CONFIG.hasOwnProperty(k)) {
            console.log('Replacing ' + k + ' from[' + CONFIG[k] + ' ] to [' + localConfig[k] + ']');
            CONFIG[k] = localConfig[k];
        }
    }
} catch (e) {
    console.log('local configuration does not exist, ignore.', e);
}

var gateway = 'https://gateway-a.watsonplatform.net/calls/data/GetNews?outputMode=json&';
var gatewayWithCount = gateway + 'count=999999&';
var enriched = 'enriched.url.';
var enrichedTitle = 'enriched.url.enrichedTitle.';

/* GET api listing. */
router.get('/keywords', function (req, res, next) {
    var options = {
        entityName: req.query.entityName,
        entityType: req.query.entityType,
        rangeInDays: req.query.rangeInDays
    };

    var responseData = {};

    doAjax(buildKeywordsUrl(options), function (result) {
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
    var requestNum = 2;

    var responseData = {};

    doAjax(buildSentimentUrl('positive', options), function (result) {
        responseData.positiveCounts = result;
        sendAsyncResponse(++responseCounter, requestNum, res, responseData);
    });

    doAjax(buildSentimentUrl('negative', options), function (result) {
        responseData.negativeCounts = result;
        sendAsyncResponse(++responseCounter, requestNum, res, responseData);
    });
});

router.get('/breakdown', function (req, res, next) {
    var options = {
        start: req.query.start,
        end: req.query.end
    };


    var entries = req.query.entries.split(",");
    var numEntries = entries.length * 2;
    var responseData = {
        entries: []
    };
    var responseCounter = 0;
    var sentiments = ['positive', 'negative'];

    for (var i = 0; i < entries.length; i++) {
        for (var z = 0; z < sentiments.length; z++) {
            var callbackParams = {
                'entry': entries[i],
                'sentiment': sentiments[z]
            };

            doAjax(buildBreakdownUrl(entries[i], sentiments[z], options), function (result, callbackParams) {
                var positiveCounts = result;
                var entry = {
                    entryName: callbackParams.entry,
                    sentiment: callbackParams.sentiment,
                    counts: result.result.slices
                };
                responseData.entries.push(entry);
                console.log("test sending " + callbackParams.entry + " " + callbackParams.sentiment + " " + responseCounter);
                sendAsyncResponse(++responseCounter, numEntries, res, responseData);
            }, callbackParams);
        }
    }

});


router.get('/mentions', function (req, res, next) {
    var entityNames = req.query.entityNames.split(",");
    var responseCounter = 0;
    responseData = {
        entries: []
    }
    for (var i = 0; i < entityNames.length; i++) {        
        var callbackParams = {
            'entryName': entityNames[i]
        }
        doAjax(buildMentionsUrl(entityNames[i]), function (result, callbackParams) {
            var entry = {
                'entryName': callbackParams.entryName,
                'mentions': result
            }
            console.log(entry.entryName);
            responseData.entries.push(entry);
            sendAsyncResponse(++responseCounter, entityNames.length, res, responseData);
        },callbackParams);
    }

});


router.get('/headlines', function (req, res, next) {
    var options = {
        start: req.query.start,
        end: req.query.end,
        searchText: req.query.searchText,
        count: req.query.count
    };

    doAjax(buildHeadlinesUrl(options), function (result) {
        res.json(result);
    });
});

module.exports = router;

function doAjax(url, callback, callbackParams) {
    var opts = urlApi.parse(url);
    if (CONFIG.PROXY !== '') {
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


function buildSentimentUrl(sentiment, options) {
    var url = gateway + 'start=now-60d&end=now&timeSlice=1d&' +
        'q.enriched.url.entities.entity=|text=' + options.searchText + ',sentiment.type=' + sentiment + '|&' +
        'q.enriched.url.taxonomy.taxonomy_.label=[business%20and%20industrial^finance]&' +
        'apikey=' + CONFIG.WATSON_API_KEY;
    return url;
}

function buildKeywordsUrl(options) {
    var type = '';
    if (typeof options.entityType != 'undefined' && options.entityType.length) {
        type = ',type=' + options.entityType;
    }
    var returnParams = enriched + 'entities.entity.text,' + enriched + 'entities.entity.sentiment.score,' + enriched + 'entities.entity.relevance,' +
        enriched + 'url,' + enriched + 'title';
    var url = gatewayWithCount + 'start=now-' + options.rangeInDays + 'd&end=now&q.' + enriched +
        'entities.entity=|text=' + options.entityName + type + ',relevance=>0.8|&' +
        'q.enriched.url.taxonomy.taxonomy_.label=[business%20and%20industrial^finance]&' +
        'return=' + returnParams + '&' +
        'dedup=1&apikey=' + CONFIG.WATSON_API_KEY;
    return url;
}

function buildBreakdownUrl(entry, sentiment, options) {
    var url = gateway + 'start=now-30d&end=now&timeSlice=1d&' +
        'q.enriched.url.entities.entity=|text=' + entry + ',relevance=>0.8,sentiment.type=' + sentiment + '|&' +
        'q.enriched.url.taxonomy.taxonomy_.label=[business%20and%20industrial^finance]&' +
        'apikey=' + CONFIG.WATSON_API_KEY;
    return url;
}

function buildHeadlinesUrl(options) {
    var returnParams = enriched + 'url,' + enriched + 'title,' + enriched + 'text';
    var url = gateway + 'start=now-14d&end=now&count=' + options.count + "&" +
        'q.enriched.url.entities.entity=|text=' + options.searchText + ',relevance=>0.8|&' +
        'q.enriched.url.taxonomy.taxonomy_.label=[business%20and%20industrial^finance]&' +
        'return=' + returnParams + "&" +
        'apikey=' + CONFIG.WATSON_API_KEY;
    console.log(url);
    return url;
}

function buildMentionsUrl(entityName) {
    var url = gateway + 'count=5&start=now-30d&end=now&' +
    'q.enriched.url.taxonomy.taxonomy_.label=[business%20and%20industrial^finance]&' +
    'q.enriched.url.relations.relation.subject.entities.entity.text=' + entityName + '&' +
    'q.enriched.url.relations.relation.object.entities.entity.text=' + entityName + '&' +
    'return=enriched.url.url,enriched.url.title,q.enriched.url.relations.relation.sentence&' +
    'dedup=1&apikey=' + CONFIG.WATSON_API_KEY;
    return url;
}

function sendAsyncResponse(counter, threshold, res, responseData) {
    if (counter >= threshold) {
        res.json(responseData);
    }
}






