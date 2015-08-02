var $ = require("jquery");

@Directive({
    template: require("./viewport2.html"),
    selector: "viewport",
    injections: ["$compile", "$injector"]
})
export default class Viewport2 {
    constructor(scope, element, attrs, $compile, $injector) {
        this.$compile = $compile;
        this.$injector = $injector;
        this.element = element;
        this.scope = scope;
        element.removeClass("viewport-preload");
        element.addClass("viewport2");

        var self = this;
        scope.go = function(a, b, c) { self.go(a, b, c); };

        scope.changePage = scope.go;


        //this.go("/start");


    }
    go(route) {
        if (typeof route == "string") {
            // ignore first character, assuming it is always a slash
            route = route.split("/").slice(1);
        }
        console.log("going to " + route);

        var page = this.app.topLevelRoutes.getPageForRoute(route);

        if (!page) {
            console.error("Invalid route " + route);
            return;
        }

        this.currentPage = page;

        if (this.currentPageElement) {
            this.currentPageElement.remove();
        }


        // render
        var pageEl = $("<div>New Page</div>");

        pageEl.html(page.template);

        this.element.append(pageEl);

        var newScope = this.scope.$new();
        var ctrl = page.pageCtrl[page.pageCtrl.length - 1];
        newScope.ctrl = page;
        // for backward compatibility only
        var sharedUi = this.$injector.get("sharedUi");
        var loadStatus = this.$injector.get("loadStatus");

        ctrl(newScope, sharedUi, loadStatus);

        this.$compile(pageEl)(newScope);



        this.currentPageElement = pageEl;
        console.log(page.parentSections);
        for (var i = 0; i < page.parentSections.length; i++) {
            var section = page.parentSections[i];
            section.activated(newScope);
            if (section.scopeName) {
                newScope[section.scopeName] = section;
            }
        }


        page.activated(newScope);

        // todo: call cleanup on route collection to remove unused page data

    }
}
