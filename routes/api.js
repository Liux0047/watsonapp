/**
 * Created by Allen on 2/4/2016.
 */

var express = require('express');
var router = express.Router();
var https = require('https');

var API_KEY = 'd2c38d1f5fe8ae7a528f8f01d1ca36c291e23282';
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

module.exports = router;
