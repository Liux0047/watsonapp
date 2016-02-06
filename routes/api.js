/**
 * Created by Allen on 2/4/2016.
 */

var express = require('express');
var router = express.Router();
var https = require('https');

var API_KEY_1 = 'd2c38d1f5fe8ae7a528f8f01d1ca36c291e23282';
var API_KEY_2 = 'd8f8c787d46a28787e2119fff692e863d020d7da';
var API_KEY_3 = 'ebd3a423e07ddaae345c6421485d36ff1a0ced11';

var gateway = 'https://gateway-a.watsonplatform.net/calls/data/GetNews?outputMode=json&';

/* GET api listing. */
router.get('/keywords', function (req, res, next) {
    var options = {
        start: req.query.start,
        end: req.query.end,
        title: req.query.searchText
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

module.exports = router;


function doAjax(url, callback) {
    https.get(url, function (httpsRes) {
        console.log('Got response: ' + httpsRes.statusCode);
        var data = [];
        // consume response body
        httpsRes.on('data', function (chunk) {
            data.push(chunk);
        });
        httpsRes.on('end', function () {
            var result = JSON.parse(data.join(''));
            callback(result);
        });
    }).on('error', function (e) {
        console.log('Got error: ' + e.message);
        //res.send('Error');
    });
}


function buildIOTUrl(sentiment, options, apiKey) {
    var url = gateway + 'start=now-30d&end=now&timeSlice=1d&q.enriched.url.entities.entity=|text=' + options.title + ',type=company|&' +
        '&q.enriched.url.enrichedTitle.docSentiment=|type=' + sentiment + '|&' +
        'apikey=' + apiKey;
    return url;
}

function buildKeywordsUrl (options, apiKey){
    var url = gateway + 'start=now-30d&end=now&q.enriched.url.entities.entity=|text=' + options.title + ',type=company|&' +
        'return=enriched.url.entities.entity.text,enriched.url.entities.entity.sentiment.score,enriched.url.entities.entity.relevance&' +
        'apikey=' + apiKey;
    return url;
}

function sendIOTResponse(counter, threshold, res, responseData) {
    if (counter >= threshold) {
        res.json(responseData);
    }
}

