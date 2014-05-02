Chondric.directive("cjsPreviewControls", function() {

    return {
        restrict: "AE",
        replace: true,
        templateUrl: "cjs-preview-controls.html",
        link: function(scope, element, attrs) {
            scope.previewSettings = {
                width: 1024,
                height: 768,
                overlayStatusBar: true
            };
            scope.reloadPreview = function() {
                document.getElementById("preview").contentDocument.location.reload(true);
            }
            scope.updatePreviewSettings = function(w, h, overlayStatusBar) {
                scope.previewSettings = {
                    width: w,
                    height: h,
                    overlayStatusBar: overlayStatusBar
                };
            };
        }
    }
});