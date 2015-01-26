export default ["$templateCache", "$compile", function($templateCache, $compile) {
    return {
        restrict: 'A',
        scope: true,
        link: function(scope, element, attrs) {
            var contentElement;
            if (element.children().length == 1) {
                contentElement = element.children().first();
            } else {
                contentElement = element.wrapInner("<div/>").children().first();
            }


            // get the contents of the element. If there is a single element, use it directly. if not, wrap it.
            var overlay;
            if (attrs.overlayType == "compact") {
                overlay = angular.element($templateCache.get("cjs-loading-overlay-compact.html"));
            } else if (attrs.overlayType == "simple") {
                overlay = angular.element($templateCache.get("cjs-loading-overlay-simple.html"));
            } else {
                overlay = angular.element($templateCache.get("cjs-loading-overlay.html"));
            }

            element.append(overlay);
            element.addClass("cjs-loading-overlay-container");
            $compile(overlay)(scope);


            function onUpdate(taskGroup) {
                scope.taskGroup = taskGroup;
                scope.currentTask = taskGroup.currentTask;
                if (taskGroup.completed) {
                    // finished                    
                    scope.message = "finished";
                    if (attrs.showUnloaded === undefined)
                        contentElement.addClass("ui-show").removeClass("ui-hide");
                    contentElement.addClass("cjs-loaded").removeClass("cjs-unloaded");
                    overlay.addClass("ui-hide").removeClass("ui-show");
                } else {
                    if (attrs.showUnloaded === undefined)
                        contentElement.addClass("ui-hide").removeClass("ui-show");
                    contentElement.addClass("cjs-unloaded").removeClass("cjs-loaded");
                    contentElement.addClass("cjs-unloaded");
                    overlay.addClass("ui-show").removeClass("ui-hide");
                    scope.title = taskGroup.title;
                    scope.error = taskGroup.error;
                    scope.message = taskGroup.message;
                }
            }
            scope.$watch("loadStatus", function(val) {
                if (!val) return;
                val.onUpdate(scope.$eval(attrs.cjsLoadingOverlay), onUpdate);
            });

        }
    };
}];