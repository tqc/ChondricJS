// add a loading overlay if the scope has dataLoadStatus.waitingForData set.
// if dataLoadStatus.error is set, it will be displayed as an error message.
// if dataLoadStatus.retry is a function, a button wil be displayed
// if dataLoadStatus.cancel is set, a button will be displayed.
Chondric.directive('cjsLoadingOverlay', function($compile) {
    return {
        replace: true,
        templateUrl: "cjs-loading-overlay.html"
    }
});