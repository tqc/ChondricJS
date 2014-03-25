/* 
Just a placeholder for now - this stuff needs to be implemented properly as a directive for the new app structure
*/

/*
 
         app.touchevents = {
            touchstart: "touchstart",
            touchend: "touchend",
            touchmove: "touchmove"
        };


        if (document.ontouchend === undefined) {
            // touch not supported - use mouse events for swipe
            app.touchevents = {
                touchstart: "mousedown",
                touchend: "mouseup mouseleave",
                touchmove: "mousemove"
            };
        }

        app.appLoadLog("Setting up event handlers");



        var nextPage = app.activeView;
        nextPage.ensureLoaded("active", function() {});
        if (nextPage.next) app.Views[nextPage.next].ensureLoaded("next", function() {});
        if (nextPage.prev) app.Views[nextPage.prev].ensureLoaded("prev", function() {});



        var swiping = false;

        var startX = 0;
        var startY = 0;
        var dx = 0;
        var dy = 0;

        var activePage;
        var nextPage;
        var prevPage;

        var viewportWidth;
        var horizontal = false;
        var vertical = false;

        var canSwipeLeft = false;
        var canSwipeRight = false;


        $(document).on(app.touchevents.touchstart, ".page.active.swipe", function(e) {
            //                alert("1");
            if (app.transitioning) return;
            if (swiping) return;
            swiping = true;

            //            console.log("start swipe");

            if (e.originalEvent.changedTouches) {
                startX = e.originalEvent.changedTouches[0].clientX;
                startY = e.originalEvent.changedTouches[0].clientY;

            } else {
                startX = e.clientX;
                startY = e.clientY;
                dx = 0;
                dy = 0;
                horizontal = false;
                vertical = false;
            }

            activePage = app.activeView.element;
            nextPage = app.activeView.next && app.getView(app.activeView.next).element;
            prevPage = app.activeView.prev && app.getView(app.activeView.prev).element;

            app.viewportWidth = $(".viewport").width();

            canSwipeRight = prevPage && prevPage.length > 0 || activePage.hasClass("swipetoblank");
            canSwipeLeft = nextPage && nextPage.length > 0 || activePage.hasClass("swipetoblank");


        });


        $(document).on(app.touchevents.touchmove, ".page.active.swipe", function(e) {
            if (app.transitioning) return;
            if (!swiping) return;
            if (vertical) return;
            //            console.log("continue swipe");

            if (e.originalEvent.changedTouches) {
                dx = e.originalEvent.changedTouches[0].clientX - startX;
                dy = e.originalEvent.changedTouches[0].clientY - startY;
            } else {

                dx = e.clientX - startX;
                dy = e.clientY - startY;
            }
            if (dx > 20 || dx < -20 && (dy < 20 && dy > -20)) {
                horizontal = true;
            }

            if (!horizontal && (dy > 20 || dy < -20)) {
                vertical = true;
                dx = 0;
                app.activeView.setSwipePosition(prevPage, nextPage, dx, 0);

            } else if (horizontal) {

                if (dx < 0 && canSwipeLeft) {
                    app.activeView.setSwipePosition(prevPage, nextPage, dx, 0);
                }
                if (dx > 0 && canSwipeRight) {
                    app.activeView.setSwipePosition(prevPage, nextPage, dx, 0);

                }
                return false;

            }

            //   e.stopPropagation();
            //                return false;

        });
        $(document).on(app.touchevents.touchend, ".page.active.swipe", function(e) {
            if (app.transitioning) return;
            if (!swiping) return;
            swiping = false;
            //   console.log("end swipe");

            app.activeView.setSwipePosition(prevPage, nextPage, undefined, null);

            $(".page.active .page.next .page.prev").attr("style", "");

            swiping = false;
            if (dx < -100 && app.activeView.next) app.activeView.showNextPage();
            else if (dx > 100 && app.activeView.prev) app.activeView.showPreviousPage();
            else {

                app.activeView.setSwipePosition(prevPage, nextPage, null, null);

            }

            dx = 0;
            dy = 0;
            horizontal = false;
            vertical = false;
        });

 
 */