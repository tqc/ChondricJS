Chondric.directive('cjsLoadingOverlay', function($templateCache, $compile) {
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
            } else {
                overlay = angular.element($templateCache.get("cjs-loading-overlay.html"));
            }

            element.append(overlay);

            $compile(overlay)(scope);

            scope.$watch(attrs.cjsLoadingOverlay, function(status) {
                if (!status) return;
                var currentTask = null;
                for (var i = 0; i < status.tasks.length; i++) {
                    var task = status.tasks[i];
                    if (task.error) {
                        currentTask = task;
                        break;
                    }
                    if (task.progressCurrent < task.progressTotal && (!currentTask || task.progressTotal > currentTask.progressTotal)) {
                        currentTask = task;
                    }
                }

                scope.currentTask = currentTask;
                if (!currentTask) {
                    // finished                    
                    scope.message = "finished";
                    contentElement.addClass("ui-show").removeClass("ui-hide");
                    overlay.addClass("ui-hide").removeClass("ui-show");
                } else {
                    contentElement.addClass("ui-hide").removeClass("ui-show");
                    overlay.addClass("ui-show").removeClass("ui-hide");
                    scope.title = currentTask.title;
                    scope.error = currentTask.error;
                    scope.message = currentTask.progressCurrent + " / " + currentTask.progressTotal;
                }

            }, true);

        }
    };
});

Chondric.directive('cjsShowAfterLoad', function() {
    return {
        link: function(scope, element, attrs) {
            scope.$watch(attrs.cjsShowAfterLoad, function(status) {
                if (!status) return;
                var currentTask = null;
                for (var i = 0; i < status.tasks.length; i++) {
                    var task = status.tasks[i];
                    if (task.error) {
                        currentTask = task;
                        break;
                    }
                    if (task.progressCurrent < task.progressTotal && (!currentTask || task.progressTotal > currentTask.progressTotal)) {
                        currentTask = task;
                    }
                }

                if (!currentTask) {
                    element.addClass("ui-show").removeClass("ui-hide");
                } else {
                    element.addClass("ui-hide").removeClass("ui-show");
                }
            }, true);
        }
    };
});