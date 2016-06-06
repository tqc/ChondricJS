export default function() {

    var style = document.body.style;
    var transitionStyle = "transition";
    if (style.transition === undefined && style.webkitTransition !== undefined) transitionStyle = "-webkit-transition";
    else if (style.transition === undefined && style.mozTransition !== undefined) transitionStyle = "-moz-transition";

    var transformStyle = "transform";
    if (style.transform === undefined && style.webkitTransform !== undefined) transformStyle = "-webkit-transform";
    else if (style.transform === undefined && style.mozTransform !== undefined) transformStyle = "-moz-transform";

    return {
        restrict: "AC",
        link: function(scope, element, attr) {
            scope.$watch(attr.ngStylePrefixer, function ngStyleWatchAction(newStyles, oldStyles) {
                var k;
                if (oldStyles && (newStyles !== oldStyles)) {
                    for (k in oldStyles) {
                        element.css(k, '');
                    }
                }

                if (newStyles) {
                    var convertedStyles = {};

                    for (k in newStyles) {
                        var v = newStyles[k];
                        if (k == "transform") {
                            k = transformStyle;
                        }
                        if (k == "transition") {
                            k = transitionStyle;
                            if (v) v = v.replace("transform", transformStyle);
                        }

                        convertedStyles[k] = v;
                    }
                    element.css(convertedStyles);

                }
            }, true);
        }
    };
}
