Chondric.directive("cjsPopup", function() {

    return {
        //        restrict: "E",
        link: function(scope, element, attrs) {

            var useMouse = true;

            var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);

            if (iOS) {
                useMouse = false;
            }

            function clickOutsidePopup(e) {
                if (element[0] != e.target && !element[0].contains(e.target)) {
                    scope.$apply("hideModal('" + attrs.cjsPopup + "')");
                }
            }


            element.addClass("modal");
            element.addClass("popup");

            var parentPageElement = element.closest(".chondric-page");
            if (parentPageElement.length === 0) parentPageElement = element.closest(".chondric-section");
            if (parentPageElement.length === 0) parentPageElement = element.closest(".chondric-viewport");
            var overlay = $(".modal-overlay", parentPageElement);
            if (overlay.length === 0) {
                overlay = angular.element('<div class="modal-overlay"></div>');
                parentPageElement.append(overlay);
            }

            scope.$watch(attrs.cjsPopup, function(val) {
                if (document.activeElement && !window.NativeNav) document.activeElement.blur();
                if (element.hasClass("nativetransition")) {
                    if (!val) {
                        element.removeClass("active");
                    } else {
                        element.addClass("active");
                    }

                } else {
                    if (!val) {
                        overlay.removeClass("active");
                        element.removeClass("active");
                        window.document.removeEventListener(useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);
                    } else {
                        window.document.addEventListener(useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);

                        overlay.addClass("active");
                        element.addClass("active");
                    }

                }
            });
        }
    };
});