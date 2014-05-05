Chondric.allTransitions.slideleft = {
    transitionIn: {
        start: function(element) {
            // show element and move to left
            $(element).css({
                "display": "block"
            });
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(100%, 0)"
            });
        },
        cancel: function(element, prevProgress) {
            // move element to left with transition
            var time = (prevProgress) * 300;

            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(100%, 0)"
            });

            return time;
        },
        complete: function(element, prevProgress) {
            // set transform to 0 with transition
            var time = (1 - prevProgress) * 300;
            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(0, 0)"
            });
            return time;
        },
        progress: function(element, progress) {
            // set element position without transition
            $(element).css({
                "display": "block"
            });
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(" + ((1 - progress) * 100) + "%, 0)"
            });
        }
    },
    transitionOut: {
        start: function(element) {
            // set webkit-transform to 0
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(0, 0)"
            });

        },
        cancel: function(element, prevProgress) {
            // set transform to 0 with transition
            var time = (prevProgress) * 300;
            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(0, 0)"
            });
            return time;
        },
        complete: function(element, prevProgress) {
            // move element to right with transition
            var time = (1 - prevProgress) * 300;
            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(-100%, 0)"
            });
            return time;
        },
        progress: function(element, progress) {
            // set element position without transition
            $(element).css({
                "display": "block"
            });
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(" + (progress * -100) + "%, 0)"
            });
        }
    },
    reset: function(element) {
        // remove transition, transform and display settings from relevant subelements
        element.css({
            "display": ""
        });
        $(".body", element).css({
            "-webkit-transition": "",
            "-webkit-transform": ""
        });
    }
};
Chondric.allTransitions.slideright = {
    transitionIn: {
        start: function(element) {
            // show element and move to left
            $(element).css({
                "display": "block"
            });
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(-100%, 0)"
            });
        },
        cancel: function(element, prevProgress) {
            // move element to left with transition
            var time = (prevProgress) * 300;

            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(-100%, 0)"
            });

            return time;
        },
        complete: function(element, prevProgress) {
            // set transform to 0 with transition
            var time = (1 - prevProgress) * 300;
            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(0, 0)"
            });
            return time;
        },
        progress: function(element, progress) {
            // set element position without transition
            $(element).css({
                "display": "block"
            });
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(" + ((1 - progress) * -100) + "%, 0)"
            });
        }
    },
    transitionOut: {
        start: function(element) {
            // set webkit-transform to 0
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(0, 0)"
            });

        },
        cancel: function(element, prevProgress) {
            // set transform to 0 with transition
            var time = (prevProgress) * 300;
            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(0, 0)"
            });
            return time;
        },
        complete: function(element, prevProgress) {
            // move element to right with transition
            var time = (1 - prevProgress) * 300;
            $(".body", element).css({
                "-webkit-transition": "-webkit-transform " + time + "ms ease-in-out",
                "-webkit-transform": "translate(100%, 0)"
            });
            return time;
        },
        progress: function(element, progress) {
            // set element position without transition
            $(element).css({
                "display": "block"
            });
            $(".body", element).css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate(" + (progress * 100) + "%, 0)"
            });
        }
    },
    reset: function(element) {
        // remove transition, transform and display settings from relevant subelements
        element.css({
            "display": ""
        });
        $(".body", element).css({
            "-webkit-transition": "",
            "-webkit-transform": ""
        });
    }
};