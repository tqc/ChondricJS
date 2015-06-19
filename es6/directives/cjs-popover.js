var angular = require('angular');

export default {
    name: "cjsPopover",
    injections: [],
    fn: () => ({
        //        restrict: "E",
        link: function(scope, element, attrs) {
            var useOverlay = attrs.noOverlay === undefined;
            var horizontal = attrs.horizontal !== undefined;
            var menuwidth = parseFloat(attrs.menuwidth) || 280;
            var menuheight = parseFloat(attrs.menuheight) || 150;

            element.addClass("modal");
            element.addClass("popover");

            function clickOutsidePopup(e) {
                var r = element[0].getBoundingClientRect();
                var x = e.changedTouches ? e.changedTouches[0].clientX : e.touches ? e.touches[0].clientX : e.clientX;
                var y = e.changedTouches ? e.changedTouches[0].clientY : e.touches ? e.touches[0].clientY : e.clientY;
                if (x > r.left && x < r.right && y > r.top && y < r.bottom) return;
                scope.$apply("hideModal('" + attrs.cjsSidepanel + "')");
            }

            function closeWithKey(e) {
                e.preventDefault();
                clickOutsidePopup(e);
            }

            function ensureOverlay() {
                var parentPageElement = element.closest(".chondric-page");
                if (parentPageElement.length === 0) parentPageElement = element.closest(".chondric-section");
                if (parentPageElement.length === 0) parentPageElement = element.closest(".chondric-viewport");
                if (useOverlay) {
                    var overlay = angular.element(".modal-overlay", parentPageElement);
                    if (overlay.length === 0) {
                        overlay = angular.element('<div class="modal-overlay"></div>');
                        parentPageElement.append(overlay);
                    }
                    return overlay;
                }
            }
            var lastFocused = null;
            scope.$watch(attrs.cjsPopover, function(val) {

                var overlay = ensureOverlay();

                if (!val) {

                    if (lastFocused && document.activeElement === element[0]) {
                        if (lastFocused.tagName == "BODY") {
                            document.activeElement.blur();
                        } else {
                            lastFocused.focus();
                        }
                        lastFocused = null;
                    }

                    if (useOverlay) {
                        overlay.removeClass("active");
                    }
                    element.removeClass("active");
                    window.document.body.removeEventListener(window.useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);
                    window.document.body.removeEventListener('keydown', closeWithKey, true);
                } else {
                    if (window.useMouse) {
                        // giving the popup focus doesn't really work on iOS, so leace focus where it is
                        if (document.activeElement && document.activeElement.tagName != "BODY") {
                            lastFocused = document.activeElement;
                        }
                        element.focus();
                    }

                    window.document.body.addEventListener(window.useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);
                    window.document.body.addEventListener('keydown', closeWithKey, true);
                    menuheight = element.outerHeight() || menuheight;
                    menuwidth = element.outerWidth() || menuwidth;

                    var menupos = {};
                    // TODO: should get actual size of the element, but it is display: none at this point.

                    //                    var sw = element[0].offsetParent.offsetWidth;
                    //                    var sh = element[0].offsetParent.offsetHeight;

                    var parentRect = element[0].offsetParent.getBoundingClientRect();

                    var sw = angular.element(window).width();
                    var sh = angular.element(window).height();

                    var horizontalCutoff = sw / 2;
                    var verticalCutoff = sh / 2;
                    var idealX = 0;
                    var idealY = 0;

                    var cr;
                    if (val.element && val.element[0]) {
                        var button = val.element[0];
                        cr = button.getBoundingClientRect();

                        if (horizontal) {
                            // x at left or right of button, y center of button
                            if (cr.right > horizontalCutoff) {
                                idealX = cr.right;
                            } else {
                                idealX = cr.left;
                            }
                            idealY = cr.top + cr.height / 2;
                        } else {
                            // x at center of button, y at left or right of button
                            var w = cr.width;
                            if (!w) w = cr.right - cr.left;

                            idealX = cr.left + w / 2;
                            if (cr.top > verticalCutoff) {
                                idealY = cr.top;
                            } else {
                                idealY = cr.bottom;
                            }
                        }

                    } else {
                        // the values usually come from mouse events which use document coordinates.
                        // convert to viewport coordinates to match getBoundingClientRect
                        idealX = (val.x || 0) - (window.pageXOffset || 0);
                        idealY = (val.y || 0) - (window.pageYOffset || 0);
                    }


                    var actualX = idealX;
                    var actualY = idealY;
                    // adjust position to ensure menu remains onscreen
                    if (horizontal) {
                        if (idealY - 10 - menuheight / 2 < 0) actualY = menuheight / 2 + 10;
                        if ((idealY + 10 + menuheight / 2) > sh) actualY = sh - menuheight / 2 - 10;
                    } else {
                        if (idealX - 10 - menuwidth / 2 < 0) actualX = menuwidth / 2 + 10;
                        if ((idealX + 10 + menuwidth / 2) > sw) actualX = sw - menuwidth / 2 - 10;
                    }

                    if (horizontal) {
                        if (actualX < horizontalCutoff) {
                            menupos.left = (actualX + 13 - parentRect.left) + "px";
                            menupos.right = "auto";
                            element.addClass("right").removeClass("left");
                        } else {
                            menupos.right = (parentRect.right - actualX + 13) + "px";
                            menupos.left = "auto";
                            element.addClass("left").removeClass("right");
                        }
                        menupos.top = (actualY - menuheight / 2 - parentRect.top) + "px";
                    } else {
                        if (actualY < verticalCutoff || (cr && actualY > cr.top)) {
                            menupos.top = (actualY + 13 - parentRect.top) + "px";
                            menupos.bottom = "auto";
                            element.addClass("down").removeClass("up");
                        } else {
                            menupos.bottom = (parentRect.bottom - actualY + 13) + "px";
                            menupos.top = "auto";
                            element.addClass("up").removeClass("down");
                        }
                        menupos.left = (actualX - menuwidth / 2 - parentRect.left) + "px";
                    }

                    var indel = angular.element(".poparrow", element);
                    if (indel.length > 0) {
                        if (horizontal) {
                            var arrowtop = idealY - (actualY - menuheight / 2) - 13;
                            if (arrowtop < 10) arrowtop = 10;
                            if (arrowtop + 26 > menuheight - 10) arrowtop = menuheight - 10 - 26;
                            indel.css("top", arrowtop + "px");
                        } else {
                            var arrowleft = idealX - (actualX - menuwidth / 2) - 13;
                            if (arrowleft < 10) arrowleft = 10;
                            if (arrowleft + 26 > menuwidth - 10) arrowleft = menuwidth - 10 - 26;
                            indel.css("left", arrowleft + "px");

                        }
                    }
                    if (useOverlay) {
                        overlay.addClass("active");
                    }
                    element.addClass("active");
                    element.css(menupos);
                }
            });
        }
    })
};
