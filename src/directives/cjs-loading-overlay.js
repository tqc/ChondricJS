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
            } else if (attrs.overlayType == "simple") {
                overlay = angular.element($templateCache.get("cjs-loading-overlay-simple.html"));
            } else {
                overlay = angular.element($templateCache.get("cjs-loading-overlay.html"));
            }

            element.append(overlay);
            element.addClass("cjs-loading-overlay-container");
            $compile(overlay)(scope);

            scope.loadStatus.onUpdate(scope.$eval(attrs.cjsLoadingOverlay), function(taskGroup) {
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
                    contentElement.addClass("cjs-unloaded")
                    overlay.addClass("ui-show").removeClass("ui-hide");
                    scope.title = taskGroup.title;
                    scope.error = taskGroup.error;
                    scope.message = taskGroup.message;
                }
            });
        }
    };
});

Chondric.directive('cjsShowAfterLoad', function() {
    return {
        link: function(scope, element, attrs) {

            scope.loadStatus.onUpdate(scope.$eval(attrs.cjsShowAfterLoad), function(taskGroup) {
                if (taskGroup.completed) {
                    element.addClass("ui-show").removeClass("ui-hide");
                } else {
                    element.addClass("ui-hide").removeClass("ui-show");
                }
            });
        }
    };
});


Chondric.factory('loadStatus', function() {
    // simple UI to track loading status
    return {
        init: function($scope, tasks) {
            var service = {};
            var existing = $scope.loadStatus;
            if (existing) {
                $.extend(service, existing);
                service.allTasks = [].concat(existing.allTasks);

            } else {
                service.allTasks = [];
            }
            $scope.loadStatus = service;

            service.registerTask = function(key, taskOptions) {
                var task = {
                    key: key,
                    title: "Untitled Task",
                    progressCurrent: 0,
                    progressTotal: 1,
                    active: false,
                    message: "Message Here...",
                    error: null,
                    start: function() {
                        task.active = true;
                        task.error = null;
                        task.progressCurrent = 0;
                    },
                    finish: function() {
                        task.progressCurrent = task.progressTotal;
                        task.completed = true;
                        task.active = false;
                    },
                    fail: function(message) {
                        task.active = false;
                        task.error = message;
                    },
                    progress: function(progress, total, message) {
                        task.active = true;
                        task.progressCurrent = progress;
                        if (total !== undefined) task.progressTotal = total;
                        if (message !== undefined) task.message = message;
                    }
                };
                $.extend(task, taskOptions);
                service[key] = task;
                service.allTasks.push(task);
            };

            service.onUpdate = function(tasksOrKeys, fn) {
                // if no task array specified, include all tasks in the current scope
                tasksOrKeys = tasksOrKeys || service.allTasks;
                var watchedKeys = [];
                for (var i = 0; i < tasksOrKeys.length; i++) {
                    var t = tasksOrKeys[i];
                    if (typeof t == "string") watchedKeys.push(t);
                    else if (t.key) watchedKeys.push(t.key);
                }
                if (watchedKeys.length === 0) return fn({
                    tasks: [],
                    completed: true
                });

                $scope.$watch("[loadStatus." + watchedKeys.join(",loadStatus.") + "]", function(tasks) {
                    // check all tasks, see if there are any outstanding
                    if (!tasks) return;

                    var result = {
                        tasks: tasks
                    };

                    result.currentTask = undefined;
                    for (var i = 0; i < tasks.length; i++) {
                        var task = tasks[i];
                        if (task.error) {
                            result.currentTask = task;
                            break;
                        }

                        if (task.active) {
                            result.currentTask = task;
                            break;
                        }
                        if (task.progressCurrent < task.progressTotal && (!result.currentTask || task.progressTotal > result.currentTask.progressTotal)) {
                            result.currentTask = task;
                            break;
                        }
                    }
                    if (!result.currentTask) {
                        // finished                    
                        result.message = "finished";
                        result.completed = true;
                    } else {
                        result.completed = false;
                        result.title = result.currentTask.title;
                        result.error = result.currentTask.error;
                        result.message = result.currentTask.message || (result.currentTask.progressCurrent + " / " + result.currentTask.progressTotal);
                    }

                    fn(result);

                }, true);

            };

            service.after = function(tasksOrKeys, fn) {
                service.onUpdate(tasksOrKeys, function(taskGroup) {
                    if (taskGroup.completed) return fn();
                });
            };

            if (tasks) {
                for (var tk in tasks) {
                    service.registerTask(tk, tasks[tk]);
                }
            }
            return service;
        }
    };
});