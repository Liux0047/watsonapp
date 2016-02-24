function assetClassService() {
    var _assetClass;
    var ASSET_CLASS_COMMODITY = 'commodity';

    var getPorfolioCode = function () {
        var url = '' + ((window.location != window.parent.location)
            ? document.referrer
            : document.location);
        if (url) {
            var n = url.indexOf('products/');
            if(n > -1) {
                return url.substring(n + 9, n + 15);
            }
        }
        return '';
    };

    this.getAssetClass = function () {
        var portfolioCode = getPorfolioCode();
        switch (portfolioCode) {
            case '270319':
                _assetClass = ASSET_CLASS_COMMODITY;
            default:
                // randomly assign a class for local testing
                _assetClass = ASSET_CLASS_COMMODITY;
        }
        return _assetClass;
    };

    this.getAssetClassBreakdown = function () {
        switch (_assetClass) {
            case ASSET_CLASS_COMMODITY:
                return 'crude oil,natural gas,gold,silver';
            default:
                return '';
        }
    };
}

angular
    .module('watsonapp')
    .service('assetClassService', assetClassService);