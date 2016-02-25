function assetClassService() {
    var _assetClass;
    var ASSET_CLASS_COMMODITY = 'commodity';
    var ASSET_CLASS_EQUITY = 'clean%20energy';

    var getProductCode = function () {
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
        var portfolioCode = getProductCode();
        switch (portfolioCode) {
            case '270319':
                _assetClass = ASSET_CLASS_COMMODITY;
                break;
            case '239637':
                _assetClass = ASSET_CLASS_EQUITY;
                break;
            default:
                // randomly assign a class for local testing
                _assetClass = ASSET_CLASS_EQUITY;
        }
        return _assetClass;
    };

    this.getAssetClassBreakdown = function () {
        switch (_assetClass) {
            case ASSET_CLASS_COMMODITY:
                return 'crude oil,natural gas,gold,silver';
            case ASSET_CLASS_EQUITY:
                return 'solar energy,wind power,hydropower,geothermal';
            default:
                return '';
        }
    };
}

angular
    .module('watsonapp')
    .service('assetClassService', assetClassService);