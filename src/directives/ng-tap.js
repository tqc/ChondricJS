Chondric.directive('ngTap', function() {
    var lastTapLocation;

    var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);

    if (iOS && false) {
        var cancelMouseEvent = function(event) {
            if (!lastTapLocation) return;
            if (Math.abs(event.screenX - lastTapLocation.x) < 25 && Math.abs(event.screenY - lastTapLocation.y) < 25) {
                event.stopPropagation();
                event.preventDefault();
            }
        };
        window.document.addEventListener('mouseup', cancelMouseEvent, true);
        window.document.addEventListener('mousedown', cancelMouseEvent, true);
        window.document.addEventListener('click', function(event) {
            if (window.jstimer) window.jstimer.finish("ghostclick");
            cancelMouseEvent(event);
        }, true);
    }

    if (iOS) {
        window.document.addEventListener('click', function(event) {
            if (window.jstimer) window.jstimer.finish("ghostclick");
        }, true);
    }


    return function(scope, element, attrs) {
        element.addClass('tappable');

        var active = false;
        var touching = false;

        var startX = 0;
        var startY = 0;

        // detect move and cancel tap if drag started
        var move = function(e) {
            var x = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.clientX;
            var y = e.originalEvent.touches ? e.originalEvent.touches[0].clientY : e.clientY;
            if (Math.abs(x - startX) > 10 || Math.abs(y - startY) > 10) {
                cancel(e);
            }
        };

        // called if the mouse moves too much or leaves the element
        var cancel = function() {
            if (!useMouse) {
                element.unbind('touchmove', move);
                element.unbind('touchend', action);
            } else {
                element.unbind('mousemove', move);
                element.unbind('mouseout', cancel);
                element.unbind('mouseup', action);
            }

            element.removeClass('active');
            element.addClass('deactivated');

            touching = false;
            active = false;
        };

        // called when a tap is completed
        var action = function(e) {

            scope.lastTap = {
                element: element,
                x: e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].clientX : e.clientX,
                y: e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].clientY : e.clientY
            };


            if (!useMouse) {
                element.unbind('touchmove', move);
                element.unbind('touchend', action);
            } else {
                element.unbind('mousemove', move);
                element.unbind('mouseout', cancel);
                element.unbind('mouseup', action);
            }

            touching = false;
            active = false;
            element.removeClass('active');
            element.addClass('deactivated');

            window.setTimeout(function() {
                scope.$apply(attrs.ngTap, element);
            }, 0);
        };

        function start(e) {

            startX = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.clientX;
            startY = e.originalEvent.touches ? e.originalEvent.touches[0].clientY : e.clientY;

            if (!useMouse) {
                element.bind('touchmove', move);
                element.bind('touchend', action);

            } else {
                element.bind('mousemove', move);
                element.bind('mouseout', cancel);
                element.bind('mouseup', action);
            }

            element.addClass('active');
            element.removeClass('deactivated');
            active = true;
        }

        // called on mousedown or touchstart. Multiple calls are ignored.
        var mouseStart = function(e) {
            if (e.which != 1) return;
            if (active || touching) return;
            touching = false;
            start(e);
        };

        var touchStart = function(e) {
            lastTapLocation = {
                x: e.originalEvent.touches[0].screenX,
                y: e.originalEvent.touches[0].screenY
            };
            if (active) return;
            touching = true;
            if (window.jstimer) window.jstimer.start("ghostclick");
            start(e);
        };

        var useMouse = true;

        var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);

        if (iOS) {
            useMouse = false;
            element.bind('touchstart', touchStart);
        } else {
            element.bind('mousedown', mouseStart);
        }
    };
});