var lastTapLocation;
console.log("init tap");


//    var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);

// set mouse/touch flag globally. This way a tap that hides the button won't cause a click that
// triggers ng-tap on the button behind it.
window.useMouse = true;


var ghostClickCatcher = angular.element('<div style="background-color:rgba(0,0,0,0); position:absolute; top:0; bottom:0; left:0; right:0; z-index:12000; display:none;"></div>');
angular.element(document.body).append(ghostClickCatcher);
var ghostClickTimer = 0;

var hideGhostClickCatcher = function() {
    ghostClickCatcher.css("display", "none");
};

var showGhostClickCatcher = function() {
    // hide the ghost click catcher after half a second, since ios 8 only sometimes sends ghost clicks.
    // note that this isn't ideal in native mode - a heavy transition can delay simulated clicks for almost a second.
    if (ghostClickTimer) window.clearTimeout(ghostClickTimer);
    ghostClickTimer = window.setTimeout(hideGhostClickCatcher, 400);
    // todo: probably should also adjust position to align with tap location
    // otherwise tapping elsewhere on the page is disabled unnecessarily.
    ghostClickCatcher.css("display", "block");
};


ghostClickCatcher.on("mousedown", hideGhostClickCatcher);
ghostClickCatcher.on("mouseup", hideGhostClickCatcher);
ghostClickCatcher.on("mouseenter", hideGhostClickCatcher);
ghostClickCatcher.on("mouseleave", hideGhostClickCatcher);
ghostClickCatcher.on("mousemove", hideGhostClickCatcher);

// todo: turn useMouse back on if a genuine mouse event shows up
window.document.addEventListener('touchstart', function(event) {
    window.useMouse = false;
}, true);

window.document.addEventListener('mouseup', function(event) {
    hideGhostClickCatcher();
}, true);
window.document.addEventListener('mousedown', function(event) {
    hideGhostClickCatcher();
}, true);
window.document.addEventListener('click', function(event) {
    hideGhostClickCatcher();
    if (window.jstimer) window.jstimer.finish("ghostclick");
}, true);



@Directive({
    selector: "ngTap",
    injections: [],
    scope: false
})
class NgTap {
    constructor(scope, element, attrs) {

        element.addClass('tappable');

        var active = false;
        var touching = false;

        var startX = 0;
        var startY = 0;

        var touchTimeout = 0;

        var cancel, action;

        // detect move and cancel tap if drag started
        var move = function(e) {
            var x = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.clientX;
            var y = e.originalEvent.touches ? e.originalEvent.touches[0].clientY : e.clientY;
            if (Math.abs(x - startX) > 20 || Math.abs(y - startY) > 20) {
                cancel(e);
            }
        };

        // called if the mouse moves too much or leaves the element
        cancel = function() {

            if (touchTimeout) window.clearTimeout(touchTimeout);

            if (!window.useMouse) {
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
        action = function(e) {
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

            if (!window.useMouse) {
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


            // add a final check for disabled elements in case we have a race condition
            if (element.hasClass('disabled')) return;
            scope.$apply(attrs.ngTap, element);
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

            if (!window.useMouse) return;
            // cancel if we already handled this as a touch event
            if (lastTapLocation && Math.abs(event.screenX - lastTapLocation.x) < 25 && Math.abs(event.screenY - lastTapLocation.y) < 25) return;
            // because IE doesn't handle pointer-events properly
            if (element.hasClass('disabled')) return;
            // left button only
            if (e.which != 1) return;
            if (active || touching) return;
            touching = false;

            window.useMouse = true;
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
            window.useMouse = false;
            element.bind('touchmove', move);
            element.bind('touchend', action);

            start(e);
        };


        element.bind('touchstart', touchStart);
        element.bind('mousedown', mouseStart);

        element.bind('keypress', function(e) {
            action(e);
        });
    }
}

export default NgTap;
