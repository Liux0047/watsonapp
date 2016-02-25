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
                _assetClass = ASSET_CLASS_COMMODITY;
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

    this.getBreakdownPriceIndicator = function () {
        switch (_assetClass) {
            case ASSET_CLASS_COMMODITY:
                return {
                    name: 'WTI Crude Oil',
                    type: 'spline',
                    data: [26.21, 29.44, 29.44, 29.44, 29.44, 29.04, 30.66, 30.77, 29.64, 29.64, 29.64, 31.48, 31.87, 32.26],
                    yAxis: 1,
                    visible: false
                };
            case ASSET_CLASS_EQUITY:
                return {
                    name: 'China ETF',
                    type: 'spline',
                    data: [],
                    yAxis: 1,
                    visible: false
                };
            default:
                return {};
        }
    };
}

angular
    .module('watsonapp')
    .service('assetClassService', assetClassService);