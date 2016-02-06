/**
 * Created by Allen on 2/4/2016.
 */

var express = require('express');
var router = express.Router();
var https = require('https');

var API_KEY = 'd2c38d1f5fe8ae7a528f8f01d1ca36c291e23282';
//var API_KEY = 'd8f8c787d46a28787e2119fff692e863d020d7da';

var gateway = 'https://gateway-a.watsonplatform.net/calls/data/GetNews?outputMode=json&';

/* GET api listing. */
router.get('/keyword', function (req, res, next) {
    var start = req.query.start;
    var end = req.query.end;
    var title = req.query.searchText;
    var url = gateway + 'start=now-1d&end=now&q.enriched.url.title=' + title + '&' +
        'return=enriched.url.title,enriched.url.entities.entity.text,enriched.url.entities.entity.type&' +
        'apikey=' + API_KEY;

    https.get(url, function (httpsRes) {
        console.log('Got response: ' + httpsRes.statusCode);
        // consume response body
        httpsRes.on('data', function (data) {
            res.send(data);
        });
    }).on('error', function (e) {
        console.log('Got error: ' + e.message);
        res.send('Error');
    });
});


router.get('/ioc', function (req, res, next) {
    var options = {
        start: req.query.start,
        end: req.query.end,
        title: req.query.searchText
    };

    doAjax(generateIOTUrl('positive', options), function  (result) {
        var positiveCounts = result;
        console.log(positiveCounts);

        doAjax(generateIOTUrl('negative', options), function  (result) {
            var negativeCounts = result;
            console.log(negativeCounts);

            doAjax(generateIOTUrl('neutral', options), function  (result) {
                var neutralCounts = result;
                console.log(neutralCounts);

                res.json({
                    positiveCounts : positiveCounts,
                    neutralCounts : neutralCounts,
                    negativeCounts : negativeCounts
                });
            });
        });
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


function generateIOTUrl(sentiment, options) {
    var url = gateway + 'start=now-10d&end=now&timeSlice=1d&q.enriched.url.title=' + options.title + '&' +
        '&q.enriched.url.enrichedTitle.docSentiment=|type=' + sentiment + '|&' +
        'apikey=' + API_KEY;
    console.log('IOT URL generated: ' + url);
    return url;
}
