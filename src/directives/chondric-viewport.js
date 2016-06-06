@Directive({
    template: require("./chondric-viewport.html"),
    selector: "chondricViewport",
    injections: ["$compile"]
})
class Viewport {
    constructor(scope, element, attrs, $compile) {
        // clean up the generated html a little
        element.removeAttr("chondric-viewport");
        element.removeAttr("data-chondric-viewport");

        element.removeClass("viewport-preload");
        element.addClass("chondric-viewport");

        scope.debugMode = window.debugMode || false;

        if (window.debugMode) {
            element.addClass("debugmode");
        }

        scope.go = scope.changePage;

    }
}

export default Viewport