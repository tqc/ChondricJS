Chondric.directive("cjsSidepanel", function() {

    var panelTransitions = {
        revealRight: {
            init: function(panel, page, overlay) {
                // set initial position
            },
            progress: function(panel, page, overlay, progress) {
                // set intermediate position
            },
            cancel: function(panel, page, overlay, prevProgress) {
                // move off screen with transition, return timing
            },
            complete: function(panel, page, overlay, prevProgress) {
                // move on screen with transition, return timing
            },
            reset: function(panel, page, overlay) {
                // remove custom css
            }
        },
        coverRight: {
            init: function(panel, page, overlay) {
                // set initial position
                var spwidth = panel.width();
                overlay.css({
                    "visibility": "visible",
                    "-webkit-transition": "none",
                    "opacity": "0"
                });
                panel.css({
                    "right": 0,
                    "left": "auto",
                    "display": "block",
                    "-webkit-transition": "none",
                    "-webkit-transform": "translate(" + (spwidth) + "px, 0)"
                });
            },
            progress: function(panel, page, overlay, progress) {
                // set intermediate position
                var spwidth = panel.width();
                overlay.css({
                    "visibility": "visible",
                    "-webkit-transition": "none",
                    "opacity": (progress * 0.3)
                });
                panel.css({
                    "right": 0,
                    "left": "auto",
                    "display": "block",
                    "-webkit-transition": "none",
                    "-webkit-transform": "translate(" + (spwidth - progress * spwidth) + "px, 0)"
                });
            },
            cancel: function(panel, page, overlay, prevProgress) {
                // move off screen with transition, return timing
                var time = (prevProgress) * 300;
                var spwidth = panel.width();
                overlay.css({
                    "visibility": "visible",
                    "-webkit-transition": "opacity " + time + "ms ease-in-out",
                    "opacity": "0"
                });
                panel.css({
                    "display": "block",
                    "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                    "-webkit-transform": "translate(" + (spwidth) + "px, 0)"
                });
                return time;
            },
            complete: function(panel, page, overlay, prevProgress) {
                // move on screen with transition, return timing
                var time = (1 - prevProgress) * 300;
                overlay.css({
                    "visibility": "visible",
                    "-webkit-transition": "opacity " + time + "ms ease-in-out",
                    "opacity": "0.3"
                });
                panel.css({
                    "display": "block",
                    "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                    "-webkit-transform": "translate(" + 0 + "px, 0)"
                });
                return time;
            },
            reset: function(panel, page, overlay) {
                // remove custom css
                overlay.css({
                    "visibility": "",
                    "-webkit-transition": "",
                    "opacity": ""
                });
                panel.css({
                    "display": "",
                    "-webkit-transition": "",
                    "-webkit-transform": ""
                });
            }
        },
        slideRight: {
            init: function(panel, page, overlay) {
                // set initial position
            },
            progress: function(panel, page, overlay, progress) {
                // set intermediate position
            },
            cancel: function(panel, page, overlay, prevProgress) {
                // move off screen with transition, return timing
            },
            complete: function(panel, page, overlay, prevProgress) {
                // move on screen with transition, return timing
            },
            reset: function(panel, page, overlay) {
                // remove custom css
            }
        },
        revealLeft: {
            init: function(panel, page, overlay) {
                // set initial position
            },
            progress: function(panel, page, overlay, progress) {
                // set intermediate position
            },
            cancel: function(panel, page, overlay, prevProgress) {
                // move off screen with transition, return timing
            },
            complete: function(panel, page, overlay, prevProgress) {
                // move on screen with transition, return timing
            },
            reset: function(panel, page, overlay) {
                // remove custom css
            }
        },
        coverLeft: {
            init: function(panel, page, overlay) {
                // set initial position
                var spwidth = panel.width();
                overlay.css({
                    "visibility": "visible",
                    "-webkit-transition": "none",
                    "opacity": "0"
                });
                panel.css({
                    "left": 0,
                    "right": "auto",
                    "display": "block",
                    "-webkit-transition": "none",
                    "-webkit-transform": "translate(" + (-spwidth) + "px, 0)"
                });
            },
            progress: function(panel, page, overlay, progress) {
                // set intermediate position
                var spwidth = panel.width();
                overlay.css({
                    "visibility": "visible",
                    "-webkit-transition": "none",
                    "opacity": (progress * 0.3)
                });
                panel.css({
                    "left": 0,
                    "right": "auto",
                    "display": "block",
                    "-webkit-transition": "none",
                    "-webkit-transform": "translate(" + (-spwidth + progress * spwidth) + "px, 0)"
                });
            },
            cancel: function(panel, page, overlay, prevProgress) {
                // move off screen with transition, return timing
                var time = (prevProgress) * 300;
                var spwidth = panel.width();
                overlay.css({
                    "visibility": "visible",
                    "-webkit-transition": "opacity " + time + "ms ease-in-out",
                    "opacity": "0"
                });
                panel.css({
                    "display": "block",
                    "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                    "-webkit-transform": "translate(" + (-spwidth) + "px, 0)"
                });
                return time;
            },
            complete: function(panel, page, overlay, prevProgress) {
                // move on screen with transition, return timing
                var time = (1 - prevProgress) * 300;
                overlay.css({
                    "visibility": "visible",
                    "-webkit-transition": "opacity " + time + "ms ease-in-out",
                    "opacity": "0.3"
                });
                panel.css({
                    "display": "block",
                    "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                    "-webkit-transform": "translate(" + 0 + "px, 0)"
                });
                return time;
            },
            reset: function(panel, page, overlay) {
                // remove custom css
                overlay.css({
                    "visibility": "",
                    "-webkit-transition": "",
                    "opacity": ""
                });
                panel.css({
                    "display": "",
                    "-webkit-transition": "",
                    "-webkit-transform": ""
                });
            }
        },
        slideLeft: {
            init: function(panel, page, overlay) {
                // set initial position
            },
            progress: function(panel, page, overlay, progress) {
                // set intermediate position
            },
            cancel: function(panel, page, overlay, prevProgress) {
                // move off screen with transition, return timing
            },
            complete: function(panel, page, overlay, prevProgress) {
                // move on screen with transition, return timing
            },
            reset: function(panel, page, overlay) {
                // remove custom css
            }
        }
    };

    return {
        //        restrict: "E",
        link: function(scope, element, attrs) {

            var useMouse = true;

            var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);

            if (iOS) {
                useMouse = false;
            }

            element.addClass("modal");
            element.addClass("sidepanel");

            var pushmode;

            if (!element.hasClass("left")) {
                element.addClass("right");
                if (element.hasClass("push")) pushmode = "left";
            } else {
                if (element.hasClass("push")) pushmode = "right";
            }



            var parentPageElement = element.closest(".chondric-page");
            if (parentPageElement.length === 0) parentPageElement = element.closest(".chondric-section");
            if (parentPageElement.length === 0) parentPageElement = element.closest(".chondric-viewport");
            var overlay = $(".modal-overlay", parentPageElement);
            if (overlay.length === 0) {
                overlay = angular.element('<div class="modal-overlay"></div>');
                parentPageElement.append(overlay);
            }

            if (pushmode) {
                parentPageElement.addClass("haspushpanel");
            }


            overlay.on(useMouse ? "mousedown" : "touchstart", function() {
                scope.$apply("hideModal('" + attrs.cjsSidepanel + "')");
            });
            scope.$watch(attrs.cjsSidepanel, function(val, oldval) {
                if (!val && !oldval) return;
                if (document.activeElement) document.activeElement.blur();
                var transition = "coverRight";
                var progress = 0;
                var oldprogress = 0;
                var spwidth = element.width() || 200;
                var dwidth = $(document).width();

                if (val && val.transition) transition = val.transition;
                else if (oldval && oldval.transition) transition = oldval.transition;

                if (val && val.progress) {
                    // progress will be % of screen width
                    // convert back to px and make 100% at side panel width
                    progress = Math.min(1, val.progress * dwidth / spwidth);
                } else {
                    progress = 0;
                }
                if (oldval && oldval.progress) {
                    // progress will be % of screen width
                    // convert back to px and make 100% at side panel width
                    oldprogress = Math.min(1, oldval.progress * dwidth / spwidth);
                } else {
                    oldprogress = 0;
                }

                if (progress == 1) {
                    overlay.addClass("active");
                    if (!oldprogress) {
                        // ensure initial position was set
                        panelTransitions[transition].init(element, parentPageElement, overlay);
                    }
                    window.setTimeout(function() {
                        var time = panelTransitions[transition].complete(element, parentPageElement, overlay, oldprogress);
                    }, 0);

                } else if (progress === 0) {
                    var time = panelTransitions[transition].cancel(element, parentPageElement, overlay, oldprogress);
                    window.setTimeout(function() {
                        panelTransitions[transition].reset(element, parentPageElement, overlay);
                    }, time);
                    overlay.removeClass("active");
                } else {
                    panelTransitions[transition].progress(element, parentPageElement, overlay, progress);
                    overlay.addClass("active");
                }

            });
        }
    };
});