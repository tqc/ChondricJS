Chondric.directive('ngTap', function() {

    return function(scope, element, attrs) {
        element.addClass('tappable');

        var active = false;
        var touching = false;

        // detect move and cancel tap if drag started
        var move = function(e) {
            cancel(e);
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
                x: e.originalEvent.changedTouches ? e.originalEvent.changedTouches.offsetX : e.offsetX,
                y: e.originalEvent.changedTouches ? e.originalEvent.changedTouches.offsetY : e.offsetY
            };
            scope.$apply(attrs.ngTap, element);


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


        };

        function start() {

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
        var mouseStart = function() {
            if (active || touching) return;
            touching = false;
            start();
        };

        var touchStart = function() {
            if (active) return;
            touching = true;
            start();
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