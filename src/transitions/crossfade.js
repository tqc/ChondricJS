Chondric.allTransitions.crossfade = {
    transitionIn: {
        start: function(element) {
            // put new element in front with 0 opacity
            element.css({
                "display": "block",
                "opacity": 0,
                "z-index": 9
            });
        },
        cancel: function(element, prevProgress) {
            // move element to left with transition
            var time = (prevProgress) * 300;
            $(element).css({
                "-webkit-transition": "opacity " + time + "ms ease-in-out",
                "opacity": 0
            });

            return time;
        },
        complete: function(element, prevProgress) {
            // set transform to 0 with transition
            var time = (1 - prevProgress) * 300;
            $(element).css({
                "-webkit-transition": "opacity " + time + "ms ease-in-out",
                "opacity": 1
            });
            return time;
        },
        progress: function(element, progress) {
            element.css({
                "display": "block",
                "opacity": progress,
                "z-index": 9
            });
        }
    },
    transitionOut: {
        start: function(element) {
            // just ensure the old page remains visible while the new page fades in on top
            element.css({
                "display": "block"
            });
        },
        cancel: function(element, prevProgress) {
            var time = (prevProgress) * 300;
            return time;
        },
        complete: function(element, prevProgress) {
            // move element to right with transition
            var time = (1 - prevProgress) * 300;
            return time;
        },
        progress: function(element) {
            element.css({
                "display": "block"
            });
        }
    },
    reset: function(element) {
        // remove transition, transform and display settings from relevant subelements
        element.css({
            "display": "",
            "opacity": "",
            "z-index": "",
            "-webkit-transition": ""
        });
    }
};