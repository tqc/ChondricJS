Chondric.directive("cjsPopup", function() {

    return {
        //        restrict: "E",
        link: function(scope, element, attrs) {
            element.addClass("popup");
            var overlay = $(".modal-overlay", element.parent());
            if (overlay.length == 0) {
                overlay = angular.element('<div class="modal-overlay"></div>');
                element.parent().append(overlay);
            }
            overlay.on("mousedown touchstart", function() {
                console.log("overlay touch");
                scope.$apply(attrs.cjsPopup + "=null");
            });
            scope.$watch(attrs.cjsPopup, function(val) {
                if (!val) {
                    element.removeClass("active");
                } else {
                    element.addClass("active");
                }
            })
        }
    }
});