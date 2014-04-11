Chondric.directive("cjsSwipe", function() {

    return {
        //        restrict: "E",
        link: function(scope, element, attrs) {
            var useMouse = true;
            var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);
            if (iOS) {
                useMouse = false;
            }

            var startX = 0;
            var startY = 0;
            var threshold = 20;
            var dx = 0;
            var dy = 0;
            var width = 0;
            var height = 0;
            var swipeState = {
                left: 0,
                right: 0,
                up: 0,
                down: 0,
                leftborder: 0,
                rightborder: 0,
                topborder: 0,
                bottomborder: 0
            }
            var tracking = false;

            var updateSwipe = scope.$eval("updateSwipe");
            var endSwipe = scope.$eval("endSwipe");

            var leftRoute;
            var rightRoute;

            element.on(useMouse ? "mousedown" : "touchstart", function(e) {
                if (tracking) return;
                tracking = true;
                if (e.originalEvent.changedTouches) {
                    startX = e.originalEvent.changedTouches[0].clientX;
                    startY = e.originalEvent.changedTouches[0].clientY;
                } else {
                    startX = e.clientX;
                    startY = e.clientY;
                }
                dx = 0;
                dy = 0;
                width = element.width();
                height = element.height();
                console.log(width);
                console.log(height);

                swipeState = {
                    left: 0,
                    right: 0,
                    up: 0,
                    down: 0,
                    leftborder: 0,
                    rightborder: 0,
                    topborder: 0,
                    bottomborder: 0
                }

                $(document).on(useMouse ? "mousemove" : "touchmove", move);
                $(document).on(useMouse ? "mouseup" : "touchend", end);
                leftRoute = scope.$eval("leftRoute");
                rightRoute = scope.$eval("rightRoute");

            });

            function move(e) {
                if (e.originalEvent.changedTouches) {
                    dx = e.originalEvent.changedTouches[0].clientX - startX;
                    dy = e.originalEvent.changedTouches[0].clientY - startY;
                } else {
                    dx = e.clientX - startX;
                    dy = e.clientY - startY;
                }

                if (swipeState.left) swipeState.left = Math.max(0, -dx / width);
                else if (swipeState.right) swipeState.right = Math.max(0, dx / width);
                else if (swipeState.leftborder) swipeState.leftborder = Math.max(0, dx / width);
                else if (swipeState.rightborder) swipeState.rightborder = Math.max(0, -dx / width);
                else if (swipeState.up) swipeState.up = Math.max(0, -dy / height);
                else if (swipeState.down) swipeState.down = Math.max(0, dy / height);
                else if (swipeState.topborder) swipeState.topborder = Math.max(0, dy / height);
                else if (swipeState.bottomborder) swipeState.bottomborder = Math.max(0, -dy / height);
                else {
                    // starting a new swipe
                    if (dx > threshold && Math.abs(dy) < threshold) {
                        if (startX < 10) swipeState.leftborder = dx / width;
                        else swipeState.right = dx / width;
                    } else if (-dx > threshold && Math.abs(dy) < threshold) {
                        if (startX > width - 10) swipeState.rightborder = -dx / width;
                        else swipeState.left = -dx / width;
                    } else if (dy > threshold && Math.abs(dx) < threshold) {
                        if (startY < 10) swipeState.topborder = dy / height;
                        else swipeState.down = dy / height;
                    } else if (-dy > threshold && Math.abs(dx) < threshold) {
                        if (startY > height - 10) swipeState.bottomborder = -dy / height;
                        else swipeState.up = -dy / height;
                    }
                }

                if (updateSwipe) updateSwipe(swipeState, leftRoute, rightRoute);

            };

            function end(e) {
                if (!tracking) return;
                tracking = false;
                $(document).off(useMouse ? "mousemove" : "touchmove", move)
                $(document).off(useMouse ? "mouseup" : "touchend", end)

                if (endSwipe) endSwipe(swipeState, leftRoute, rightRoute);

                swipeState = {
                    left: 0,
                    right: 0,
                    up: 0,
                    down: 0,
                    leftborder: 0,
                    rightborder: 0,
                    topborder: 0,
                    bottomborder: 0
                }

            }


        }
    }
})

Chondric.directive("cjsTransitionStyle", function() {

    return {
        //        restrict: "E",
        link: function($scope, element, attrs) {
            $scope.$watch('transition', function(transition, old) {
                console.log("transition: ", transition);
                console.log("old: ", old);
                if (!transition) return;
                var td = app.allTransitions[transition.type];
                if (!td) return;
                if (td.setInProgress && attrs["route"] == transition.to) td.setInProgress(element, transition.progress, old && old.progress);
                if (td.setOutProgress && attrs["route"] == transition.from) td.setOutProgress(element, transition.progress, old && old.progress);

            }, true)
        }
    }
});