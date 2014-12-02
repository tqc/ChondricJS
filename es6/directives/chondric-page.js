export function chondricPage($compile) {
    return {
        scope: true,
        controller: "page.pageCtrl",
        link: function(scope, element, attrs) {


            // clean up the generated html a little
            element.removeAttr("ng-repeat");
            element.removeAttr("chondric-page");

            //            console.log("viewport directive");
            var page = scope.page;// = scope.$eval(attrs.chondricPage);
            if (!page) {
                element.html("<div>Page not found</div>");
                return;
            }
            element.addClass("chondric-page");

            if (page.cssClass) element.addClass(page.cssClass);
            if (page.options.cssClass) element.addClass(page.options.cssClass);


            var isBlockPage = false;
            if (!scope.$parent.blockUsed && page.isBlockPage) {
                scope.blockUsed = true;
                element.addClass("block");
                isBlockPage = true;
            }

            var template = page.template || "<span>Template not set</span>";

            if (page.requiredTask) template = "<div ng-if=\"!loadStatus."+page.requiredTask+".completed\">Required task: {{loadStatus."+page.requiredTask+"}}</div><div ng-if=\"loadStatus."+page.requiredTask+".completed\">"+template+"</div>";

            // the page-content element includes any necessary padding to avoid nav elements
            // set the background on page-content rather than chondric-page so that it scrolls.
            // todo: don't add this if the template already includes a page-content element
            // custom nav components may need to be outside the scrolling area.
            if (isBlockPage) template= "<div class=\"page-content\">"+template+"</div>";

            element.html(template);
            $compile(element.contents())(scope);

   
            element.attr("route", page.route);

            var isActive = false;
            scope.$watch("route", function(newRoute) {
                if (!newRoute) return;
                if (!isActive && newRoute == page.route || newRoute.indexOf(page.route+"/") === 0) {
                    isActive = true;
                    element.addClass("active");                    
                }
                if (isActive && newRoute != page.route && newRoute.indexOf(page.route+"/") !== 0) {
                    isActive = false;
                    element.removeClass("active");                    
                }
            });
        }
    };
}
