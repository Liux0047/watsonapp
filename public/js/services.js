function assetClassService() {
    var _assetClass;
    var ASSET_CLASS_COMMODITY = 'commodity';
    var ASSET_CLASS_EQUITY = 'emerging%20markets';

    var getProductCode = function () {
        var url = '' + ((window.location != window.parent.location)
                ? document.referrer
                : document.location);
        if (url) {
            var n = url.indexOf('products/');
            if (n > -1) {
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
                return 'China,South Korea,Taiwan,India';
            default:
                return '';
        }
    };

    this.getBreakdownPriceIndicator = function () {
        switch (_assetClass) {
            case ASSET_CLASS_COMMODITY:
                return {
                    name: 'WTI Crude Oil',
                    //data: [32.30, 33.22, 33.62, 33.62, 33.62, 31.62, 29.88, 32.28, 31.72, 30.89, 30.89, 30.89, 29.69, 27.94, 27.45, 26.21, 29.44, 29.44, 29.44, 29.44, 29.04, 30.66, 30.77, 29.64, 29.64, 29.64, 31.48, 31.87, 32.26, 33.06],
                    data: [29.44, 29.44, 29.44, 29.44, 29.04, 30.66, 30.77, 29.64, 29.64, 29.64, 31.48, 31.87, 32.26, 33.06],
                    yAxis: 1,
                    visible: false
                };
            case ASSET_CLASS_EQUITY:
                return {
                    name: 'iShares MSCI  <br/> China ETF',
                    data: [8211.76, 8211.76, 8211.76, 8821.76, 8687.58, 8621.36, 8837.51, 8832.45, 8832.45, 8832.45, 8926.13, 8861.88, 8744.73, 8589.07],
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