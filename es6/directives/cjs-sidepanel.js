export default {
    name: "cjsSidepanel",
    injections: [],
    fn: () => {
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
                    if (time === 0) return 0;
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
                        "-webkit-transform": "",
                        // keep position because there isn't a reasonable default
                        "right": 0,
                        "left": "auto"
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
                    if (time === 0) return 0;
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
                        "-webkit-transform": "",
                        // keep position because there isn't a reasonable default
                        "left": 0,
                        "right": "auto"
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


                function clickOutsidePopup(e) {
                    var r = element[0].getBoundingClientRect();
                    var x = e.changedTouches ? e.changedTouches[0].clientX : e.touches ? e.touches[0].clientX : e.clientX;
                    var y = e.changedTouches ? e.changedTouches[0].clientY : e.touches ? e.touches[0].clientY : e.clientY;
                    if (x > r.left && x < r.right && y > r.top && y < r.bottom) return;
                    scope.$apply("hideModal('" + attrs.cjsSidepanel + "')");
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
                var overlay = angular.element(".modal-overlay", parentPageElement);
                if (overlay.length === 0) {
                    overlay = angular.element('<div class="modal-overlay"></div>');
                    parentPageElement.append(overlay);
                }

                if (pushmode) {
                    parentPageElement.addClass("haspushpanel");
                }


                scope.$watch(attrs.cjsSidepanel, function(val, oldval) {
                    if (!val && !oldval) return;
                    if (document.activeElement && !window.NativeNav && document.activeElement.tagName != "BODY" && (((val && !oldval) || !(val && oldval)) || val.progress != oldval.progress)) {
                        document.activeElement.blur();
                    }
                    var transition = "coverRight";
                    var progress = 0;
                    var oldprogress = 0;
                    var spwidth = element.width() || 200;
                    var dwidth = angular.element(document).width();

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
                        window.document.body.addEventListener(window.useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);

                        if (!oldprogress) {
                            // ensure initial position was set
                            panelTransitions[transition].init(element, parentPageElement, overlay);
                        }
                        window.setTimeout(function() {
                            panelTransitions[transition].complete(element, parentPageElement, overlay, oldprogress);
                        }, 0);

                    } else if (progress === 0) {
                        var time = panelTransitions[transition].cancel(element, parentPageElement, overlay, oldprogress);
                        window.setTimeout(function() {
                            panelTransitions[transition].reset(element, parentPageElement, overlay);
                        }, time);
                        overlay.removeClass("active");
                        window.document.body.removeEventListener(window.useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);
                    } else {
                        panelTransitions[transition].progress(element, parentPageElement, overlay, progress);
                        overlay.addClass("active");
                        window.document.body.addEventListener(window.useMouse ? 'mousedown' : "touchstart", clickOutsidePopup, true);
                    }

                });
            }
        };
    }
};
