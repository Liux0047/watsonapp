function assetClassService() {
    var _assetClass;

    this.setAssetClass = function (assetClass) {
        _assetClass = assetClass;
    };

    this.getAssetClass = function () {
        return _assetClass;
    };

    this.getAssetClassBreakdown = function () {
        switch (_assetClass) {
            case 'commodity':
                return 'crude oil,natural gas,gold,silver';
            default:
                return '';
        }
    };
}

angular
    .module('watsonapp')
    .service('assetClassService', assetClassService);