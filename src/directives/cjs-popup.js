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


            var tabbableElements = 'a[href], area[href], input:not([disabled]),' +
                'select:not([disabled]), textarea:not([disabled]),' +
                'button:not([disabled]), iframe, object, embed, *[tabindex],' +
                '*[contenteditable]';

            function closeWithKey(e) {
                var keyCode = e.which || e.keyCode;
                if (keyCode === 27) {
                    e.preventDefault();
                    clickOutsidePopup(e);
                } else if (keyCode === 9) {
                    var te = $(tabbableElements, element);
                    var ae = $(":focus", element);
                    if (e.shiftKey) {
                        if (document.activeElement == te[0] || ae.length === 0) {
                            e.preventDefault();
                            te[te.length-1].focus();
                        }
                    } else {
                        if (document.activeElement == te[te.length - 1] || ae.length === 0) {
                            e.preventDefault();
                            te[0].focus();
                        }
                    }
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

            var lastFocused = null;

            scope.$watch(attrs.cjsPopup, function(val) {
                if (element.hasClass("nativetransition")) {
                    if (!val) {
                        element.removeClass("active");
                    } else {
                        element.addClass("active");
                    }

                } else {
                    if (!val) {

                        if (lastFocused) {
                            lastFocused.focus();
                            lastFocused = null;
                        } else {
                            if (document.activeElement && !window.NativeNav && document.activeElement.tagName != "BODY") {
                                document.activeElement.blur();
                            }
                        }

                        overlay.removeClass("active");
                        element.removeClass("active");
                        window.document.body.removeEventListener(window.useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);
                        window.document.body.removeEventListener('keydown', closeWithKey, true);
                    } else {

                        if (document.activeElement && !window.NativeNav && document.activeElement.tagName != "BODY") {
                            lastFocused = document.activeElement;
                        }
                        element.focus();
                        var te = $(tabbableElements, element);
                        if (te.length > 0) te[0].focus();


                        window.document.body.addEventListener('keydown', closeWithKey, true);


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
