Chondric.directive("cjsPopover", function() {

    return {
        //        restrict: "E",
        link: function(scope, element, attrs) {

            var useMouse = true;

            var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);

            if (iOS) {
                useMouse = false;
            }


            element.addClass("modal");
            element.addClass("popover");

            var parentPageElement = element.closest(".chondric-page");
            var overlay = $(".modal-overlay", parentPageElement);
            if (overlay.length == 0) {
                overlay = angular.element('<div class="modal-overlay"></div>');
                parentPageElement.append(overlay);
            }
            overlay.on(useMouse ? "mousedown" : "touchstart", function() {
                console.log("overlay touch");
                scope.$apply("hideModal('" + attrs.cjsPopover + "')");
            });
            scope.$watch(attrs.cjsPopover, function(val) {
                if (!val) {
                    overlay.removeClass("active");
                    element.removeClass("active");
                } else {
                    var button = val.element[0];
                    var menupos = {};
                    // TODO: should get actual size of the element, but it is display:none at this point.
                    var menuwidth = 280;

                    var sw = element[0].offsetParent.offsetWidth;
                    var sh = element[0].offsetParent.offsetHeight;
                    var cr = button.getBoundingClientRect();

                    if (cr.bottom > sh / 2) {
                        menupos.bottom = (sh - cr.top + 12) + "px";
                        menupos.top = "auto";
                        element.addClass("up").removeClass("down");
                    } else {
                        menupos.top = (cr.bottom + 12) + "px";
                        menupos.bottom = "auto";
                        element.addClass("down").removeClass("up");
                    }
                    var left = ((button.offsetLeft + button.offsetWidth / 2) - menuwidth / 2);


                    if (left < 10) {
                        left = 10;
                    }
                    if (left + menuwidth > sw - 10) {
                        left = (sw - menuwidth - 10);
                    }
                    menupos.left = left + "px"

                    var indel = $(".poparrow", element);
                    if (indel.length > 0) {
                        var arrowleft = (cr.left + cr.width / 2) - 13 - left;
                        if (arrowleft < 10) arrowleft = 10;
                        if (arrowleft + 26 > menuwidth - 10) arrowleft = menuwidth - 10 - 26;
                        indel.css("left", arrowleft + "px");
                    }

                    overlay.addClass("active");
                    element.addClass("active");
                    element.css(menupos);
                }
            })
        }
    }
});