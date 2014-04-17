Chondric.allTransitions.slideleft = {
    setInProgress: function(element, progress, prevProgress) {
        console.log("slideleft " + prevProgress + " => " + progress)
        if (progress == 1) {
            // this element just became the active page - finish the transition
            if (prevProgress == 0) {
                // call is from change page. need to position as next page since
                // it was not previously set by a swipe
            }
            var transitionTime = 0.3;
            // position as next element, then reset to default on a timer
            window.setTimeout(function() {
                // element positioned. set transition timings and remove positioning
                // so it will transition to active page defaults.
                $(".body", element).css({
                    "-webkit-transform": ""
                })
            }, 10);
            window.setTimeout(function() {
                // transition finished - clean up transition settings
                $(".body", element).css({
                    "-webkit-transition": "",
                    "-webkit-transform": ""
                })
            }, 10 + transitionTime * 1000);

        } else if (progress == 0) {
            // a transition was cancelled
            if (prevProgress != 0 && prevProgress != 1) {
                // the page was already positioned - set up timers to return smoothly
            } else {
                // just clean up
                $(".body", element).css({
                    "-webkit-transition": "",
                    "-webkit-transform": ""
                })
            }
        }
        if (!progress || progress == 1) {
            $(".body", element).css({
                "-webkit-transition": "",
                "-webkit-transform": ""
            })
        } else {
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(" + ((1 - progress) * 100) + "%, 0)"
            })
        }
    },
    setOutProgress: function(element, progress, prevProgress) {
        if (!progress || progress == 1) {
            $(".body", element).css({
                "-webkit-transition": "",
                "-webkit-transform": ""
            })
        } else {
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(" + (progress * -100) + "%, 0)"
            })
        }
    }
};
Chondric.allTransitions.slideright = {
    transitionIn: {
        start: function(element) {
            // show element and move to left
            $(element).css({
                "display": "block"
            })
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(-100%, 0)"
            })
        },
        cancel: function(element, prevProgress) {
            // move element to left with transition
            var time = (prevProgress) * 300;

            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(-100%, 0)"
            })

            return time;
        },
        complete: function(element, prevProgress) {
            // set transform to 0 with transition
            var time = (1 - prevProgress) * 300;
            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(0, 0)"
            })
            return time;
        },
        progress: function(element, progress) {
            // set element position without transition
            $(element).css({
                "display": "block"
            })
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(" + ((1 - progress) * -100) + "%, 0)"
            })
        }
    },
    transitionOut: {
        start: function(element) {
            // set webkit-transform to 0
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(0, 0)"
            })

        },
        cancel: function(element, prevProgress) {
            // set transform to 0 with transition
            var time = (prevProgress) * 300;
            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(0, 0)"
            })
            return time;
        },
        complete: function(element, prevProgress) {
            // move element to right with transition
            var time = (1 - prevProgress) * 300;
            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(100%, 0)"
            })
            return time;
        },
        progress: function(element, progress) {
            // set element position without transition
            $(element).css({
                "display": "block"
            })
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(" + (progress * 100) + "%, 0)"
            })
        }
    },
    reset: function(element) {
        // remove transition, transform and display settings from relevant subelements
        element.css({
            "display": ""
        })
        $(".body", element).css({
            "-webkit-transition": "",
            "-webkit-transform": ""
        })
    },
    setInProgress: function(element, progress, prevProgress) {
        console.log("slideright " + prevProgress + " => " + progress)
        if (!progress || progress == 1) {
            $(".body", element).css({
                "-webkit-transition": "",
                "-webkit-transform": ""
            })
        } else {
            element.css({
                "display": "block"
            })
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(" + ((1 - progress) * -100) + "%, 0)"
            })
        }
    },
    setOutProgress: function(element, progress, prevProgress) {
        if (!progress || progress == 1) {
            $(".body", element).css({
                "-webkit-transition": "",
                "-webkit-transform": ""
            })
        } else {
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(" + (progress * 100) + "%, 0)"
            })
        }
    }
}