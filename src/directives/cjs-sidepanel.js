Chondric.directive("cjsSidepanel", function() {

    return {
        //        restrict: "E",
        link: function(scope, element, attrs) {

            var useMouse = true;

            var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);

            if (iOS) {
                useMouse = false;
            }

            element.addClass("modal");
            element.addClass("sidepanel");

            var pushmode;

            if (!element.hasClass("left")) {
                element.addClass("right");
                if (element.hasClass("push")) pushmode = "left";
            } else {
                if (element.hasClass("push")) pushmode = "right";
            }



            var parentPageElement = element.closest(".chondric-page");
            var overlay = $(".modal-overlay", parentPageElement);
            if (overlay.length == 0) {
                overlay = angular.element('<div class="modal-overlay"></div>');
                parentPageElement.append(overlay);
            }

            if (pushmode) {
                parentPageElement.addClass("haspushpanel");
            }


            overlay.on(useMouse ? "mousedown" : "touchstart", function() {
                scope.$apply("hideModal('" + attrs.cjsSidepanel + "')");
            });
            scope.$watch(attrs.cjsSidepanel, function(val) {
                if (!val) {
                    if (pushmode) {
                        parentPageElement.removeClass("pushed" + pushmode);
                    }
                    overlay.removeClass("active");
                    element.removeClass("active");
                } else {
                    if (pushmode) {
                        parentPageElement.addClass("pushed" + pushmode);
                    }
                    overlay.addClass("active");
                    element.addClass("active");
                }
            })
        }
    }
});