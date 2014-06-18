Chondric.directive("cjsPopover", function() {
    return {

        //        restrict: "E",
        link: function(scope, element, attrs) {
            var useOverlay = attrs.noOverlay === undefined;
            var horizontal = attrs.horizontal !== undefined;
            var menuwidth = parseFloat(attrs.menuwidth) || 280;
            var menuheight = parseFloat(attrs.menuheight) || 150;

            var useMouse = true;

            var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);

            if (iOS) {
                useMouse = false;
            }


            element.addClass("modal");
            element.addClass("popover");

            function clickOutsidePopup(e) {
                if (element[0] != e.target && !element[0].contains(e.target)) {
                    scope.$apply("hideModal('" + attrs.cjsPopover + "')");
                }
            }


            function ensureOverlay(element, useOverlay) {
                var parentPageElement = element.closest(".chondric-page");
                if (parentPageElement.length === 0) parentPageElement = element.closest(".chondric-section");
                if (parentPageElement.length === 0) parentPageElement = element.closest(".chondric-viewport");
                if (useOverlay) {
                    var overlay = $(".modal-overlay", parentPageElement);
                    if (overlay.length === 0) {
                        overlay = angular.element('<div class="modal-overlay"></div>');
                        parentPageElement.append(overlay);
                    }
                    return overlay;
                }
            }

            scope.$watch(attrs.cjsPopover, function(val) {
                if (document.activeElement && useOverlay && !window.NativeNav && document.activeElement.tagName != "BODY") document.activeElement.blur();
                var overlay = ensureOverlay(element, useOverlay);

                if (!val) {
                    if (useOverlay) {
                        overlay.removeClass("active");
                    }
                    element.removeClass("active");
                    window.document.removeEventListener(useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);
                } else {
                    window.document.addEventListener(useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);
                    menuheight = element.height() || menuheight;
                    menuwidth = element.width() || menuwidth;

                    var menupos = {};
                    // TODO: should get actual size of the element, but it is display: none at this point.

                    var sw = element[0].offsetParent.offsetWidth;
                    var sh = element[0].offsetParent.offsetHeight;

                    var horizontalCutoff = sw / 2;
                    var verticalCutoff = sh / 2;
                    var idealX = 0;
                    var idealY = 0;


                    if (val.element && val.element[0]) {
                        var button = val.element[0];
                        var cr = button.getBoundingClientRect();

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
                            idealX = cr.left + cr.width / 2;
                            if (cr.bottom > verticalCutoff) {
                                idealY = cr.top;
                            } else {
                                idealY = cr.bottom;
                            }
                        }

                    } else {
                        idealX = val.x || 0;
                        idealY = val.y || 0;
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
                            menupos.left = (actualX + 13) + "px";
                            menupos.right = "auto";
                            element.addClass("right").removeClass("left");
                        } else {
                            menupos.right = (sw - actualX + 13) + "px";
                            menupos.left = "auto";
                            element.addClass("left").removeClass("right");
                        }
                        menupos.top = (actualY - menuheight / 2) + "px";
                    } else {
                        if (actualY < verticalCutoff) {
                            menupos.top = (actualY + 13) + "px";
                            menupos.bottom = "auto";
                            element.addClass("down").removeClass("up");
                        } else {
                            menupos.bottom = (sh - actualY + 13) + "px";
                            menupos.top = "auto";
                            element.addClass("up").removeClass("down");
                        }
                        menupos.left = (actualX - menuwidth / 2) + "px";
                    }

                    /* 

                        if (cr.bottom > sh / 2) {
                            menupos.bottom = (sh - cr.top + 12) + "px";
                            menupos.top = "auto";
                            
                        } else {
                            menupos.top = (cr.bottom + 12) + "px";
                            menupos.bottom = "auto";
                            element.addClass("down").removeClass("up");
                        }
                        var left = ((button.offsetLeft + button.offsetWidth / 2) - menuwidth / 2);
                        var arrowleft = (cr.left + cr.width / 2) - 13 - left;

*/

                    var indel = $(".poparrow", element);
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
    };
});