// add a loading overlay if the scope has dataLoadStatus.waitingForData set.
// if dataLoadStatus.error is set, it will be displayed as an error message.
// if dataLoadStatus.retry is a function, a button wil be displayed
// if dataLoadStatus.cancel is set, a button will be displayed.
Chondric.directive('loadingOverlay', function($compile) {
    return {
        replace: true,
        template: '<div class="loadingoverlay" ng-show="dataLoadStatus.waitingForData"><div ng-show="!dataLoadStatus.error" class="progress large"><div></div></div><div ng-show="!dataLoadStatus.error">Loading</div><div class="error" ng-show="dataLoadStatus.error">{{dataLoadStatus.error}}</div><div><button ng-show="dataLoadStatus.retry && dataLoadStatus.error" ng-tap="dataLoadStatus.retry()">Retry</button><button ng-show="dataLoadStatus.cancel" ng-tap="dataLoadStatus.cancel()">Cancel</button></div></div>'
    }
});