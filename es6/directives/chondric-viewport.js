@Directive({
    template: require("./chondric-viewport.html"),
    selector: "chondricViewport",
    injections: ["$compile"]
})
export default class Viewport {
    constructor(scope, element, attrs, $compile) {
        // clean up the generated html a little
        element.removeAttr("chondric-viewport");
        element.removeAttr("data-chondric-viewport");

        element.removeClass("viewport-preload");
        element.addClass("chondric-viewport");


        scope.go = scope.changePage;

    }
}
