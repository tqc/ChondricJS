export var chondricPage = ["$compile", function($compile) {
    return {
        scope: true,
        controller: "page.pageCtrl",
        link: function(scope, element, attrs) {


            // clean up the generated html a little
            element.removeAttr("ng-repeat");
            element.removeAttr("chondric-page");

            //            console.log("viewport directive");
            var page = scope.page; // = scope.$eval(attrs.chondricPage);
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


            if (page.requiredTask) {
                template = "<div ng-if=\"!loadStatus." + page.requiredTask + ".completed\" class=\"page-loading\">" + page.preloadContent + "</div><div ng-if=\"loadStatus." + page.requiredTask + ".completed\">" + template + "</div>";

                scope.$watch("loadStatus.allTasks", function(tasks) {
                    if (!tasks) return;
                    scope.currentTask = null;
                    for (var i = 0; i < tasks.length; i++) {
                        var task = tasks[i];
                        if (task.active || task.error) {
                            scope.currentTask = task;
                            break;
                        }
                        if (task.key == page.requiredTask) {
                            scope.currentTask = task;
                            break;
                        }
                    }
                }, true);

            }

            if (isBlockPage) {
                // the page-content element includes any necessary padding to avoid nav elements
                // set the background on page-content rather than chondric-page so that it scrolls.
                // todo: don't add this if the template already includes a page-content element
                // custom nav components may need to be outside the scrolling area.
                template = "<div class=\"page-content\">" + template + "</div>";

                if (page.fixedTemplate) {
                    template = "<div class=\"scrollcontainer\"><div class=\"scrollheader\">" + page.fixedTemplate + "</div>" + template+ "</div>";
                }
                else {
                    element.addClass("scrollcontainer");
                }

                // add any popups etc here
                // modal overlay will be active if the route is not complete
                // but need to distinguish between popups and accordion sections.
                // modals div is much like subsections but applies when isSection is false.
                template += "<div class=\"page-modals\"></div>";
            }
            element.html(template);
            $compile(element.contents())(scope);


            element.attr("route", page.route);

            var isActive = false;
            scope.$watch("route", function(newRoute) {

                // todo: handle popup section of route

                // route is now "/main/page;/popup/first;/popup/second;/popup/current"

                if (!newRoute) return;

                var splitRoute = newRoute.split(";");
                // just ignore popups for now
                var mainRoute = splitRoute[0];

                if (!isActive && mainRoute == page.route || mainRoute.indexOf(page.route + "/") === 0) {
                    // set active for main page and parent sections
                    isActive = true;
                    element.addClass("active");
                }
                else if (isActive && mainRoute != page.route && mainRoute.indexOf(page.route + "/") !== 0) {
                    // deactivate others, only applying change if page was previously active
                    isActive = false;
                    element.removeClass("active");
                }
                else if (scope.activePopups[scope.activePopups.length-1] && scope.activePopups[scope.activePopups.length-1] == page.route) {
                    element.removeClass("prev-popup");
                    element.addClass("active-popup");
                }
                else if (scope.activePopups[scope.activePopups.length-2] && scope.activePopups[scope.activePopups.length-2] == page.route) {
                    element.removeClass("active-popup");
                    element.addClass("prev-popup");
                }
                else {
                    element.removeClass("active-popup");
                    element.removeClass("prev-popup");
                }



            });
        }
    };
}];
