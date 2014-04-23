Chondric.directive("cjsPopup", function() {

    return {
        //        restrict: "E",
        link: function(scope, element, attrs) {

            var useMouse = true;

            var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);

            if (iOS) {
                useMouse = false;
            }

            element.addClass("modal");
            element.addClass("popup");
            var parentPageElement = element.closest(".chondric-page");
            var overlay = $(".modal-overlay", parentPageElement);
            if (overlay.length == 0) {
                overlay = angular.element('<div class="modal-overlay"></div>');
                parentPageElement.append(overlay);
            }

            overlay.on(useMouse ? "mousedown" : "touchstart", function() {
                console.log("overlay touch");
                scope.$apply("hideModal('" + attrs.cjsPopup + "')");
            });
            scope.$watch(attrs.cjsPopup, function(val) {
                if (document.activeElement) document.activeElement.blur();
                if (!val) {
                    overlay.removeClass("active");
                    element.removeClass("active");
                } else {
                    overlay.addClass("active");
                    element.addClass("active");
                }
            })
        }
    }
});