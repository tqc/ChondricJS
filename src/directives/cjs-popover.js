Chondric.directive("cjsPopover", function() {

    return {
        //        restrict: "E",
        link: function(scope, element, attrs) {
            element.addClass("popover");

            var overlay = $(".modal-overlay", element.parent());
            if (overlay.length == 0) {
                overlay = angular.element('<div class="modal-overlay"></div>');
                element.parent().append(overlay);
            }
            overlay.on("mousedown touchstart", function() {
                console.log("overlay touch");
                scope.$apply(attrs.cjsPopover + "=null");
            });
            scope.$watch(attrs.cjsPopover, function(val) {
                if (!val) {
                    element.removeClass("active");
                } else {
                    element.addClass("active");
                    element.css({
                        top: val.y + "px",
                        left: val.x + "px"
                    })
                }
            })
        }
    }
});