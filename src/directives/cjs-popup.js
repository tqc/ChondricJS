Chondric.directive("cjsPopup", function() {

    return {
        //        restrict: "E",
        link: function(scope, element, attrs) {
            var previousAdditionalClasses;


            function clickOutsidePopup(e) {
                var r = element[0].getBoundingClientRect();
                var x = e.changedTouches ? e.changedTouches[0].clientX : e.touches ? e.touches[0].clientX : e.clientX;
                var y = e.changedTouches ? e.changedTouches[0].clientY : e.touches ? e.touches[0].clientY : e.clientY;
                if (x > r.left && x < r.right && y > r.top && y < r.bottom) return;
                scope.$apply("hideModal('" + attrs.cjsSidepanel + "')");
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
                if (document.activeElement && !window.NativeNav && document.activeElement.tagName != "BODY") document.activeElement.blur();
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
                        window.document.body.removeEventListener(window.useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);
                    } else {
                        window.document.body.addEventListener(window.useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);
                        if (previousAdditionalClasses) element.removeClass(previousAdditionalClasses);
                        previousAdditionalClasses = val.additionalClasses;

                        overlay.addClass("active");
                        element.addClass("active");                        
                        if (val.additionalClasses) element.addClass(val.additionalClasses);
                    }

                }
            });
        }
    };
});
