Chondric.directive('ngTap', function() {
    var lastTapLocation;
console.log("init tap");
    var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);

    // set mouse/touch flag globally. This way a tap that hides the button won't cause a click that
    // triggers ng-tap on the button behind it.
    var useMouse = true;

    // however, system elements such as dropdowns and text areas can still be triggered by the ghost click,
    // so we have this code to try and kill the click events created 300ms after a handled touch event.
    var cancelMouseEvent = function(event) {
        console.log("no last tap - event at " + event.screenY);
        if (!lastTapLocation) return;
        console.log("checking ghost click: "+lastTapLocation.y + " - " + event.screenY);
        if (Math.abs(event.screenX - lastTapLocation.x) < 25 && Math.abs(event.screenY - lastTapLocation.y) < 25) {

            // ie8 fix
            if (!event.stopPropagation) {
                event.stopPropagation = function() {
                    event.cancelBubble = true; //ie
                };
            }

            if (!event.preventDefault) {
                event.preventDefault = function() {
                    event.returnValue = false; //ie
                };
            }
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
            event.stopPropagation();
            event.preventDefault();


            // setting the focus here since node.setActive pulls up the keyboard anyway - may as well
            // have the input going somewhere valid.
            
            event.target.focus();

        }
    };
    window.document.addEventListener('mouseup', function(event) {
        hideGhostClickCatcher();
     //   cancelMouseEvent(event);
    }, true);
    window.document.addEventListener('mousedown', function(event) {
        hideGhostClickCatcher();
     //   cancelMouseEvent(event);
    }, true);
    window.document.addEventListener('click', function(event) {
        hideGhostClickCatcher();
        if (window.jstimer) window.jstimer.finish("ghostclick");
     //   cancelMouseEvent(event);
    }, true);


    var ghostClickCatcher = $('<div style="background-color:rgba(0,0,0,0); position:absolute; top:0; bottom:0; left:0; right:0; z-index:12000; display:none;"></div>')
    $(document.body).append(ghostClickCatcher);
    ghostClickCatcher.on("mousedown", hideGhostClickCatcher);
    function showGhostClickCatcher() {
         ghostClickCatcher.css( "display", "block" );
    }

    function hideGhostClickCatcher() {
        ghostClickCatcher.css( "display", "none" );
    }



    return function(scope, element, attrs) {
        element.addClass('tappable');

        var active = false;
        var touching = false;

        var startX = 0;
        var startY = 0;

        var touchTimeout = 0;

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
           
            if (touchTimeout) window.clearTimeout(touchTimeout);

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
            if (touchTimeout) window.clearTimeout(touchTimeout);

            if (e.originalEvent.handled) return;
            e.originalEvent.handled = true;

            if (e.originalEvent.changedTouches) {
                showGhostClickCatcher();
            }


            scope.lastTap = {
                element: element,
                x: e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].clientX : e.clientX,
                y: e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].clientY : e.clientY
            };
/*

            // ie8 fix
            if (!e.originalEvent.stopPropagation) {
                e.originalEvent.stopPropagation = function() {
                    e.originalEvent.cancelBubble = true; //ie
                };
            }

            if (!e.originalEvent.preventDefault) {
                e.originalEvent.preventDefault = function() {
                    e.originalEvent.returnValue = false; //ie
                };
            }

            e.originalEvent.stopPropagation();
            e.originalEvent.preventDefault();
*/
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

            element.addClass('active');
            element.removeClass('deactivated');
            active = true;
        }

        // called on mousedown or touchstart. Multiple calls are ignored.
        var mouseStart = function(e) {
            if (e.originalEvent.handled) return;
            e.originalEvent.handled = true;

            if (!useMouse) return;
            // cancel if we already handled this as a touch event
            if (lastTapLocation && Math.abs(event.screenX - lastTapLocation.x) < 25 && Math.abs(event.screenY - lastTapLocation.y) < 25) return;
            // because IE doesn't handle pointer-events properly 
            if (element.hasClass('disabled')) return;
            // left button only
            if (e.which != 1) return;
            if (active || touching) return;
            touching = false;

            useMouse = true;
            element.bind('mousemove', move);
            element.bind('mouseout', cancel);
            element.bind('mouseup', action);


            start(e);
        };

        var touchStart = function(e) {

            if (e.originalEvent.handled) return;
            e.originalEvent.handled = true;
            lastTapLocation = {
                x: e.originalEvent.touches[0].screenX,
                y: e.originalEvent.touches[0].screenY
            };

            touchTimeout = window.setTimeout(function() {
                touchTimeout = 0;
                cancel();
            }, 500);

            if (active) return;
            touching = true;
            if (window.jstimer) window.jstimer.start("ghostclick");
            useMouse = false;
            element.bind('touchmove', move);
            element.bind('touchend', action);

            start(e);
        };


        element.bind('touchstart', touchStart);
        element.bind('mousedown', mouseStart);
    };
});