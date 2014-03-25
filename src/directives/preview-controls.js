Chondric.directive("previewcontrols", function() {

    return {
        restrict: "E",
        template: "<div id='previewcontrols'>" + "<button ng-tap='updatePreviewSettings(1024,768, true)'>iPad landscape</button>" + "<button ng-tap='updatePreviewSettings(768, 1024, true)'>iPad portrait</button>" + "<button ng-tap='updatePreviewSettings(568,320, true)'>iPhone5 landscape</button>" + "<button ng-tap='updatePreviewSettings(320, 568, true)'>iPhone5 portrait</button>" + "<button ng-tap='updatePreviewSettings(1024,748, false)'>iPad landscape iOS6</button>" + "<button ng-tap='updatePreviewSettings(768, 1004, false)'>iPad portrait iOS6</button>" + "<button ng-tap='updatePreviewSettings(568,300, false)'>iPhone5 landscape iOS6</button>" + "<button ng-tap='updatePreviewSettings(320,548, false)'>iPhone5 portrait iOS6</button>" + "<button ng-tap='reloadPreview()'>Reload</button>"

        + "</div>",
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