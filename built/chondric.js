/*! chondric-tools 2014-03-26 */
window.console || (window.console = {
    log: function() {},
    error: alert
});

var Chondric = angular.module("chondric", []);

Chondric.App = function() {
    return this;
}, Chondric.initApp = function(options) {
    function loadScripts(scriptGroupNum, callback) {
        return console.log("starting loadscripts"), scriptGroupNum >= settings.scriptGroups.length ? callback() : (console.log("calling require"), 
        void require(settings.scriptGroups[scriptGroupNum], function() {
            loadScripts(scriptGroupNum + 1, callback);
        }));
    }
    function initData(callback) {
        console.log("getting database"), app.db = settings.getDatabase(), app.db ? app.db.updateDatabase(function() {
            callback();
        }) : callback();
    }
    function attachEvents(callback) {
        callback();
    }
    function complete(callback) {
        app.debugMode && $("body").addClass("debugmode"), app.ready = !0, callback();
    }
    var app = {}, allRoutes = (app.module = angular.module(options.name || "appModule", [ "chondric" ].concat(options.angularModules || [])), 
    app.allRoutes = {});
    app.createViewTemplate = function(baseView, templateId, templateFile, viewOptions) {
        "string" == typeof templateId ? (viewOptions.baseView = baseView, viewOptions.templateId = templateId, 
        viewOptions.templateFile = templateFile) : viewOptions = baseView;
        var page = {};
        viewOptions.initAngular && viewOptions.initAngular.call(page);
        var pageController = null;
        viewOptions.controller;
        for (var cn in page.controllers) pageController || (pageController = page.controllers[cn]);
        var route = viewOptions.route || "/" + viewOptions.templateId + "/$p1/$p2";
        allRoutes[route] = {
            isSection: !1,
            controller: pageController,
            templateUrl: viewOptions.templateId + ".html"
        };
    };
    app.controller = function($scope) {
        function loadView(url) {
            if (!url) return void console.log("default route");
            var matchingRoutes = [], parts = url.split("/");
            routeLoop: for (var r in allRoutes) {
                for (var rparts = r.split("/"), i = 0; i < rparts.length; i++) if (rparts[i] != parts[i] && "$" != rparts[i][0]) continue routeLoop;
                matchingRoutes.push(r);
            }
            matchingRoutes.sort(function(a, b) {
                return a.length - b.length;
            });
            for (var openViews = $scope.openViews, i = 0; i < matchingRoutes.length; i++) {
                for (var template = $scope.allRoutes[matchingRoutes[i]], mrp = matchingRoutes[i].split("/"), ar = "", params = {}, j = 0; j < mrp.length; j++) "$" == mrp[j][0] && (params[mrp[j].substr(1)] = decodeURIComponent(parts[j])), 
                parts[j] && (ar += "/" + parts[j]);
                if (console.log(params), !template.isSection) {
                    console.log("Get page with route " + ar);
                    var page = openViews[ar];
                    return void (page || (page = openViews[ar] = {
                        controller: template.controller,
                        templateUrl: template.templateUrl,
                        params: params
                    }));
                }
                console.log("Get section with route " + ar);
                var section = openViews[ar];
                section || (section = openViews[ar] = {
                    controller: template.controller,
                    isSection: !0,
                    params: params,
                    subsections: {}
                }), openViews = section.subsections;
            }
        }
        app.scope = $scope, $scope.allRoutes = allRoutes, $scope.route = null, $scope.nextRoute = null, 
        $scope.lastRoute = null, $scope.transition = "crossfade", $scope.openViews = {}, 
        $scope.changePage = app.changePage = function(r, transition) {
            return !r || r.indexOf("/") < 0 ? void console.error("changePage syntax has changed - the first parameter is a route url instead of an id") : void ($scope.route != r && ($scope.lastRoute == r && ($scope.lastRoute = null), 
            $scope.transition = transition || "crossfade", $scope.noTransition = !0, loadView(r), 
            $scope.nextRoute = r, window.setTimeout(function() {
                $scope.noTransition = !1, $scope.route = r, $scope.$apply();
            }, 100)));
        }, $scope.$watch("route", function(url, oldVal) {
            $scope.nextRoute = null, $scope.lastRoute = oldVal, console.log("Route changed to " + url + " from " + oldVal), 
            loadView(url);
        }), options.appCtrl && options.appCtrl($scope);
    };
    app.ready = !1, app.autohidesplashscreen = !1, app.Pages = {}, app.Actions = {}, 
    app.startTime = new Date().getTime(), app.Views = {}, app.ViewTemplates = {}, app.platform = "web", 
    app.isSimulator = !1;
    var settings = {
        name: "Base App",
        mightBePhoneGap: !0,
        loadPageFromHash: !0,
        scriptGroups: [],
        angularModules: [],
        contexts: {},
        getDatabase: null,
        loadData: function(loadedctx, callback) {
            callback();
        },
        customInit: function(callback) {
            callback();
        },
        updateNotificationSettings: function() {
            console.warn("updateNotificationSettings is not implemented");
        },
        notificationReceived: function() {
            console.warn("notificationReceived is not implemented");
        },
        debugMode: !1
    };
    $.extend(settings, options), app.settings = settings, app.debugMode = settings.debugMode, 
    app.angularModules = settings.angularModules, app.notificationReceived = settings.notificationReceived, 
    app.angularAppModule = angular.module("AppModule", [ "chondric" ].concat(app.angularModules), function($controllerProvider) {
        app.controllerProvider = $controllerProvider;
    }), this.appLoadLog = function(msg) {
        console.log(msg);
    }, this.getView = function(viewId) {
        var view = app.Views[viewId];
        if (view) return view;
        var ind = viewId.indexOf("_"), templateId = viewId.substr(0, ind) || viewId;
        return app.ViewTemplates[templateId] || app.createViewTemplate({
            templateId: templateId
        }), view = app.Views[viewId] = new app.ViewTemplates[templateId]({
            id: viewId
        });
    };
    var pageCleanupTimer = 0;
    this.pageCleanup = function() {
        var currentPage = app.activeView, lastPage = app.lastPage, preloads = app.activeView.preloads || [];
        currentPage.next && preloads.push(currentPage.next), currentPage.prev && preloads.push(currentPage.prev);
        for (var k in app.Views) if (!(currentPage && currentPage.id == k || currentPage && currentPage.prev == k || currentPage && currentPage.next == k || lastPage && lastPage.id == k || preloads.indexOf(k) >= 0)) {
            var v = app.Views[k];
            v && v.unload(), delete app.Views[k];
        }
        for (var i = 0; i < preloads.length; i++) console.log("preload: " + preloads[i]), 
        app.getView(preloads[i]).ensureLoaded(null, function() {});
        pageCleanupTimer = 0;
    }, this.queuePageCleanup = function() {
        pageCleanupTimer || (pageCleanupTimer = window.setTimeout(app.pageCleanup, 200));
    }, this.transition = function(nextPageId, inPageClass, outPageClass) {
        if (app.transitioning) {
            if (app.transitioningTo == nextPageId) return;
            app.transitioning = !1, app.transitioningTo = void 0;
        }
        app.transitioning = !0, app.transitioningTo = nextPageId;
        var thisPage = app.lastPage = app.activeView;
        thisPage.ensureLoaded("active", function() {
            var nextPage = app.getView(nextPageId);
            thisPage.deactivating(nextPage), nextPage.ensureLoaded(inPageClass, function() {
                window.setTimeout(function() {
                    history.pushState({}, null, "#" + nextPageId), nextPage.loading ? nextPage.isActivating = !0 : (nextPage.activating(thisPage), 
                    nextPage.scope && nextPage.scope.$apply());
                }, 0), thisPage.element.one("webkitTransitionEnd", function() {
                    window.setTimeout(function() {
                        app.transitioning = !1, app.transitioningTo = void 0, app.splashScreenHidden || app.hideSplashScreen(), 
                        nextPage.loading ? nextPage.isActivated = !0 : (nextPage.activated(), nextPage.scope && nextPage.scope.$apply()), 
                        app.queuePageCleanup();
                    }, 0);
                }), thisPage.setSwipePosition(null, nextPage.element, null), thisPage.element.addClass(outPageClass).removeClass("active"), 
                nextPage.element.addClass("active").removeClass(inPageClass), "behinddlg" == outPageClass && (nextPage.dlgbg = thisPage.id), 
                app.activeView = nextPage;
            });
        });
    }, this.transitions = {
        pop: {
            inPageClass: "behindsmall",
            outPageClass: "behindfull"
        },
        dlgpop: {
            inPageClass: "behindsmall",
            outPageClass: "behinddlg"
        },
        dlgclose: {
            inPageClass: "behinddlg",
            outPageClass: "behindsmall"
        },
        close: {
            inPageClass: "behindfull",
            outPageClass: "behindsmall"
        },
        prev: {
            inPageClass: "prev",
            outPageClass: "next"
        },
        next: {
            inPageClass: "next",
            outPageClass: "prev"
        },
        crossfade: {
            inPageClass: "behindfull",
            outPageClass: "behindfull"
        }
    };
    var initEvents = function(callback) {
        callback();
    }, loadFirstPage = function(callback) {
        app.scope.route = "/start", callback();
    };
    app.splashScreenHidden = !1, app.hideSplashScreen = function() {
        app.splashScreenHidden || ("cordova" == app.platform && navigator && navigator.splashscreen && navigator.splashscreen.hide(), 
        app.splashScreenHidden = !0);
    }, app.registerForNotifications = function() {
        "cordova" == app.platform && window.plugins && window.plugins.pushNotification && window.plugins.pushNotification.register(function(result) {
            settings.updateNotificationSettings(result, !0);
        }, function(error) {
            console.error(error), settings.updateNotificationSettings(null, !1);
        }, {
            badge: "true",
            sound: "true",
            alert: "true",
            ecb: "app.notificationReceived"
        });
    };
    var loadHostSettings = function(callback) {
        $.ajax({
            url: "../settings.json" + location.search,
            dataType: "json",
            error: function() {
                console.warn("error loading ../settings.json"), app.hostSettings = {}, callback();
            },
            success: function(data) {
                app.hostSettings = data, void 0 !== data.debug && (app.debugMode = data.debug), 
                callback();
            }
        });
    };
    app.init = function() {
        console.warn("no longer need to call app.init manually");
    };
    var init = function(callback) {
        console.log("beginning app initialization");
        var initInternal = function() {
            app.scope.platform = app.platform, app.scope.$apply();
            var sizeChanged = function() {
                var w = $(window).width(), h = $(window).height();
                console.log(w + "," + h), 1024 == h || 768 == h || 320 == h || 568 == h || 480 == h ? $(".viewport").addClass("hasstatusbar") : $(".viewport").removeClass("hasstatusbar"), 
                768 > w && 1 != app.scope.maxColumns ? (console.log("setting singlecolumn"), app.scope.maxColumns = 1, 
                $(".viewport").addClass("singlecolumn"), app.scope.$apply()) : w >= 768 && 3 != app.scope.maxColumns && (console.log("setting multicolumn"), 
                app.scope.maxColumns = 3, $(".viewport").removeClass("singlecolumn"), app.scope.$apply());
            };
            sizeChanged(), $(window).on("resize", sizeChanged), console.log("begin internal init"), 
            loadScripts(0, function() {
                console.log("loaded scripts"), initEvents(function() {
                    loadHostSettings(function() {
                        initData(function() {
                            console.log("loading context");
                            var loadedctx = JSON.parse(localStorage["appcontext_" + settings.name] || "{}");
                            settings.loadData.call(app, loadedctx, function() {
                                attachEvents(function() {
                                    settings.customInit.call(app, function() {
                                        loadFirstPage(function() {
                                            complete(function() {
                                                callback && callback();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        };
        settings.mightBePhoneGap && "file:" == document.location.protocol ? (app.isPhonegap = !0, 
        app.platform = "cordova", document.addEventListener("deviceready", function() {
            console.log("appframework deviceready"), console.log(device.platform), app.isSimulator = device.platform.indexOf("Simulator") > 0, 
            $(initInternal);
        }, !1)) : (app.platform = "web", $(initInternal));
    };
    return app.module.run([ "$rootScope", "$compile", "$controller", function($rootScope) {
        app.rootScope = $rootScope, console.log("angular app module run"), init();
    } ]), angular.element(document).ready(function() {
        angular.bootstrap(document, [ app.module.name ]);
    }), app;
}, Chondric.View = function(options) {
    var settings = {
        id: null,
        element: null,
        swipe: !0,
        swipeToBlank: !1
    };
    $.extend(settings, options), this.settings = settings;
    for (var k in settings) this[k] = settings[k];
    this.initInternal(settings);
}, $.extend(Chondric.View.prototype, {
    updateViewBackground: function() {
        this.updateView();
    },
    updateView: function() {},
    attachEvents: function() {
        console.log("no events to attach");
    },
    renderThumbnail: function() {},
    getDefaultModel: function() {
        return {};
    },
    updateModel: function(dataId, existingData, callback) {
        this.model || (this.model = this.getDefaultModel());
        this.model;
        callback();
    },
    updateData: function() {},
    init: function() {},
    initAngular: function() {},
    initInternal: function(options) {
        console.log("init view - " + options.testOption), this.init(options);
    },
    templateLoaded: function() {
        console.log("template loaded");
    },
    activating: function() {
        console.log("activating");
    },
    activated: function() {
        console.log("activated");
    },
    deactivating: function() {
        console.log("deactivating");
    },
    setSwipePosition: function(prevPageElement, nextPageElement, dx, duration) {
        var thisPage = this;
        void 0 !== duration && (thisPage.element[0].style.webkitTransitionDuration = duration, 
        nextPageElement && nextPageElement[0] && (nextPageElement[0].style.webkitTransitionDuration = duration), 
        prevPageElement && prevPageElement[0] && (prevPageElement[0].style.webkitTransitionDuration = duration)), 
        null === dx ? (thisPage.element[0].style.webkitTransform = null, nextPageElement && nextPageElement[0] && (nextPageElement[0].style.webkitTransform = null), 
        prevPageElement && prevPageElement[0] && (prevPageElement[0].style.webkitTransform = null)) : void 0 !== dx && (prevPageElement && prevPageElement.addClass("prev"), 
        nextPageElement && nextPageElement.addClass("next"), thisPage.element[0].style.webkitTransform = "translateX(" + dx + "px)", 
        nextPageElement && nextPageElement[0] && 0 > dx && (nextPageElement[0].style.webkitTransform = "translateX(" + (app.viewportWidth + 10 + dx) + "px)"), 
        prevPageElement && prevPageElement[0] && dx > 0 && (prevPageElement[0].style.webkitTransform = "translateX(" + (-app.viewportWidth - 10 + dx) + "px)"));
    },
    unload: function() {
        var view = this;
        view.element && view.element.remove(), delete view.element, view.scope && (view.scope.$destroy(), 
        delete view.scope);
    },
    getViewTemplate: function(callback) {
        var view = this, viewurl = view.templateFile + "?nocache=" + app.startTime;
        $.get(viewurl, null, function(data) {
            var html = $(data), pe = $(".page", html), content = "";
            content = 0 === html.length ? "Error - Invalid page template" : html.hasClass("page") ? html.html() : pe.length >= 1 ? pe.html() : data;
            var ctrl = pe.attr("ng-controller") || html.attr("ng-controller");
            callback(content, ctrl);
        });
    },
    load: function() {
        var view = this;
        view.getViewTemplate(function(content, controllerName) {
            var ind = view.id.indexOf("_"), templateId = view.templateId || view.id.substr(0, ind) || view.id;
            view.dataId = view.id.substr(ind + 1) || "", view.params = view.dataId.split("_"), 
            controllerName = controllerName || view.controllerName || templateId + "Ctrl";
            var controller = null;
            if (view.initAngular(), !controller && view.controller) app.controllerProvider.register(controllerName, view.controller); else if (!controller && view.controllers && view.controllers[controllerName]) for (var cn in view.controllers) app.controllerProvider.register(cn, view.controllers[cn]); else controllerName = null;
            var fullcontent = "";
            fullcontent = controllerName ? "<div ng-controller='" + controllerName + "'>" + content + "</div>" : "<div ng-scope>" + content + "</div>";
            var newelement = app.compile(fullcontent)(app.rootScope);
            view.element.append(newelement), view.scope = newelement.scope(), view.isActivating && (view.activating(), 
            view.isActivating = !1), view.isActivated && (view.activated(), view.isActivated = !1), 
            view.scope.$apply(), view.updateViewBackground(), view.attachEvents(), view.loading = !1, 
            view.element.removeClass("loading");
        });
    },
    ensureDataLoaded: function(callback) {
        var view = this;
        if (view.model) callback(); else {
            var ind = view.id.indexOf("_"), templateId = view.id.substr(0, ind) || view.id, dataId = view.id.substr(templateId.length + 1);
            view.updateModel(dataId, null, callback);
        }
    },
    ensureLoaded: function(pageclass, callback) {
        var view = this;
        if (view.element && (!pageclass || view.element.attr("class") == "page " + templateId + " " + pageclass)) return callback();
        var ind = view.id.indexOf("_"), templateId = view.id.substr(0, ind) || view.id, safeId = view.id.replace(/\/\.\|/g, "_");
        view.ensureDataLoaded(function() {
            view.element = $("#" + safeId), 0 == view.element.length && (view.loading = !0, 
            $(".viewport").append('<div class="page ' + templateId + " notransition loading " + pageclass + '" id="' + safeId + '"></div>'), 
            view.element = $("#" + safeId), view.element.append('<div class="content"></div>'), 
            view.element.append('<div class="loadingOverlay"><a href="javascript:window.location.reload()">Reload</a></div>'), 
            view.load()), pageclass && ($(".page." + pageclass).each(function() {
                this != view.element[0] && $(this).removeClass(pageclass);
            }), view.element.attr("class", "page " + templateId + " notransition " + pageclass)), 
            view.swipe && view.element.addClass("swipe"), view.swipeToBlank && view.element.addClass("swipetoblank"), 
            view.loading && view.element.addClass("loading"), window.setTimeout(function() {
                view.element.removeClass("notransition"), window.setTimeout(function() {
                    callback();
                }, 0);
            }, 0);
        });
    },
    showNextPage: function() {
        this.next && app.changePage(this.next, "next");
    },
    showPreviousPage: function() {
        this.prev && app.changePage(this.prev, "prev");
    }
}), Chondric.VersionedDatabase = function(db, updatefunctions, tables) {
    this.sqlerror = function(t, err) {
        err && err.message ? console.error(err.message) : t && t.message ? console.error(t.message) : err ? console.error(err) : t ? console.error(t) : console.log("sql error");
    };
    var sqlerror = this.sqlerror, getVersion = function(versionCallback) {
        console.log("checking version"), db.transaction(function(tx) {
            tx.executeSql("SELECT * FROM settings where key=?", [ "dbVersion" ], function(t, result) {
                if (0 == result.rows.length) return versionCallback(0);
                var row = result.rows[0] || result.rows.item(0);
                window.setTimeout(function() {
                    return versionCallback(parseFloat(row.val));
                }, 0);
            }, function() {
                window.setTimeout(function() {
                    versionCallback(0);
                }, 0);
            });
        }, function() {
            window.setTimeout(function() {
                versionCallback(0);
            }, 0);
        });
    };
    this.updateDatabase = function(callback) {
        getVersion(function(currentVersion) {
            console.log("Current database version is " + currentVersion);
            var existingversion = currentVersion, versionQueue = [];
            for (vn in updatefunctions) {
                var vv = parseFloat(vn);
                vv > existingversion && versionQueue.push(vn);
            }
            return 0 == versionQueue.length ? callback() : void db.transaction(function(tx) {
                for (vn in updatefunctions) {
                    var vv = parseFloat(vn);
                    vv > existingversion && (updatefunctions[vn](tx), tx.executeSql("INSERT OR REPLACE INTO settings (key, val) VALUES (?, ?)", [ "dbVersion", vv ], function() {}, sqlerror), 
                    existingversion = vv);
                }
            }, sqlerror, function() {
                callback();
            });
        });
    }, this.dropDatabase = function(callback) {
        db.transaction(function(tx) {
            for (tn in tables) tx.executeSql("DROP TABLE " + tn, [], null, sqlerror);
        }, sqlerror, function() {
            callback();
        });
    }, this.resetDatabase = function(callback) {
        var that = this;
        this.dropDatabase(function() {
            that.updateDatabase(callback);
        });
    };
}, Chondric.directive("ngTap", function() {
    return function(scope, element, attrs) {
        element.addClass("tappable"), attrs.ngTap && 0 == attrs.ngTap.indexOf("app.") && !scope.app && (scope.app = app);
        var tapping = !1, touching = !1, clicking = !1, touchstart = function() {
            element.addClass("active"), element.removeClass("deactivated"), tapping = !0;
        }, touchmove = function() {
            element.removeClass("active"), element.addClass("deactivated"), tapping && (tapping = !1);
        }, touchend = function(e) {
            return element.removeClass("active"), tapping && (tapping = !1, scope.$apply(attrs.ngTap, element)), 
            clicking = !1, tapping = !1, e.preventDefault(), e.stopPropagation(), !1;
        };
        element.bind("mousedown", function(e) {
            touching || (clicking = !0, touchstart(e));
        }), element.bind("touchstart", function(e) {
            touching = !0, touchstart(e);
        }), element.bind("touchmove mousemove", touchmove), element.bind("touchend", touchend), 
        element.bind("mouseup", function(e) {
            !touching && clicking && (touchend(e), clicking = !1);
        }), element.bind("tap click", function() {});
    };
}), Chondric.directive("previewcontrols", function() {
    return {
        restrict: "E",
        template: "<div id='previewcontrols'><button ng-tap='updatePreviewSettings(1024,768, true)'>iPad landscape</button><button ng-tap='updatePreviewSettings(768, 1024, true)'>iPad portrait</button><button ng-tap='updatePreviewSettings(568,320, true)'>iPhone5 landscape</button><button ng-tap='updatePreviewSettings(320, 568, true)'>iPhone5 portrait</button><button ng-tap='updatePreviewSettings(1024,748, false)'>iPad landscape iOS6</button><button ng-tap='updatePreviewSettings(768, 1004, false)'>iPad portrait iOS6</button><button ng-tap='updatePreviewSettings(568,300, false)'>iPhone5 landscape iOS6</button><button ng-tap='updatePreviewSettings(320,548, false)'>iPhone5 portrait iOS6</button><button ng-tap='reloadPreview()'>Reload</button></div>",
        link: function(scope) {
            scope.previewSettings = {
                width: 1024,
                height: 768,
                overlayStatusBar: !0
            }, scope.reloadPreview = function() {
                document.getElementById("preview").contentDocument.location.reload(!0);
            }, scope.updatePreviewSettings = function(w, h, overlayStatusBar) {
                scope.previewSettings = {
                    width: w,
                    height: h,
                    overlayStatusBar: overlayStatusBar
                };
            };
        }
    };
}), Chondric.directive("chondricViewport", function($compile) {
    return {
        link: function(scope, element) {
            console.log("viewport directive");
            var rv = (scope.$parent.rk, scope.$parent.rv), template = "";
            rv ? rv.isSection ? (scope.pageParams = rv.params || {}, template = '<div chondric-viewport class="{{transition}}" ng-class="{\'chondric-section\': rv.isSection, \'chondric-page\': !rv.isSection, active: rk == route, next: rk == nextRoute, prev: rk == lastRoute, notransition: noTransition}" ng-repeat="(rk, rv) in rv.subsections" route="{{rk}}" ng-controller="rv.controller"></div>') : rv.templateUrl ? (scope.pageParams = rv.params || {}, 
            template = '<div ng-include src="rv.templateUrl"></div>') : template = "<span>Template not set</span>" : (element.addClass("chondric-viewport"), 
            template = '<div chondric-viewport class="{{transition}}" ng-class="{\'chondric-section\': rv.isSection, \'chondric-page\': !rv.isSection, active: rk == route, next: rk == nextRoute, prev: rk == lastRoute, notransition: noTransition}" ng-repeat="(rk, rv) in openViews" route="{{rk}}" ng-controller="rv.controller"></div>');
            var newElement = angular.element(template);
            $compile(newElement)(scope), element.html(""), element.append(newElement);
        }
    };
}), Chondric.Syncable = function(options) {
    var syncable = this, localIndex = {}, remoteIndex = {}, settings = syncable.settings = {
        bulkSave: !1,
        saveAllToDb: function() {},
        saveToDb: function() {},
        removeFromDb: function() {},
        getRemoteId: function(remoteVersion) {
            return remoteVersion.key;
        },
        merge: function(wrapper, callback) {
            wrapper.localId || (wrapper.localId = wrapper.remoteId), wrapper.hasLocalChanges || (wrapper.localVersion = wrapper.unmergedRemoteVersion), 
            wrapper.unmergedRemoteVersion && (wrapper.remoteVersion = wrapper.unmergedRemoteVersion, 
            delete wrapper.unmergedRemoteVersion), wrapper.remoteVersion && (wrapper.remoteId = settings.getRemoteId(wrapper.remoteVersion)), 
            callback();
        },
        upload: function(wrapper, callback) {
            callback();
        }
    };
    return $.extend(settings, options), syncable.updateIndex = function(wrapper) {
        wrapper.remoteId && (remoteIndex[wrapper.remoteId] = wrapper), wrapper.localId && (localIndex[wrapper.localId] = wrapper);
    }, syncable.getByRemoteId = function(id, callback) {
        if (remoteIndex[id]) return callback(remoteIndex[id]);
        var wrapper = {
            remoteId: id
        };
        return callback(wrapper);
    }, syncable.getByLocalId = function(id, callback) {
        return callback(localIndex[id]);
    }, syncable.addNew = function(localId, localVersion) {
        var wrapper = {
            localId: localId,
            localVersion: localVersion,
            hasLocalChanges: !0,
            lastModified: new Date().getTime()
        };
        return syncable.updateIndex(wrapper), wrapper;
    }, syncable.save = function(wrapper) {
        syncable.updateIndex(wrapper), settings.bulkSave ? settings.saveAllToDb(localIndex) : settings.saveToDb(wrapper);
    }, syncable.queueSave = function(wrapper, lastModified, isSystemUpdate) {
        isSystemUpdate || (wrapper.hasLocalChanges = !0), wrapper.lastModified = lastModified || new Date().getTime(), 
        syncable.save(wrapper);
    }, syncable.loadFromDbResults = function(wrappers) {
        for (var i = 0; i < wrappers.length; i++) {
            var wrapper = wrappers[i];
            wrapper.remoteId && remoteIndex[wrapper.remoteId] || wrapper.localId && localIndex[wrapper.localId] || syncable.updateIndex(wrapper);
        }
    }, syncable.loadSavedLocalIndex = function(data) {
        localIndex = data;
        for (var li in data) syncable.updateIndex(data[li]);
    }, syncable.sync = function(wrapper, getRemoteVersion, mergeFunction, uploadFunction, callback) {
        getRemoteVersion(wrapper.remoteId, function(newRemoteVersion) {
            wrapper.unmergedRemoteVersion = newRemoteVersion, (mergeFunction || settings.merge)(wrapper, function() {
                syncable.updateIndex(wrapper), wrapper.hasLocalChanges ? uploadFunction(wrapper, function() {
                    (mergeFunction || settings.merge)(wrapper, function() {
                        syncable.updateIndex(wrapper), syncable.queueSave(wrapper, wrapper.lastModified, !0), 
                        callback();
                    });
                }) : (syncable.queueSave(wrapper, wrapper.lastModified, !0), callback());
            });
        });
    }, syncable.syncRemoteIndex = function(remoteObjects, callback) {
        var keys = [];
        for (var rk in remoteObjects) keys.push(rk);
        var processItem = function(i) {
            return i >= keys.length ? callback() : void syncable.getByRemoteId(keys[i], function(wrapper) {
                syncable.sync(wrapper, function(remoteId, callback) {
                    callback(remoteObjects[keys[i]]);
                }, settings.merge, settings.upload, function() {
                    processItem(i + 1);
                });
            });
        };
        processItem(0);
    }, syncable.syncRemoteArray = function() {}, syncable.syncLocalChanges = function(callback) {
        syncable.getItems(function(item) {
            return item.hasLocalChanges;
        }, function(changedItems) {
            var loopfn = function(i) {
                return i >= changedItems.length ? callback() : changedItems[i].unmergedRemoteVersion ? loopfn(i + 1) : void syncable.sync(changedItems[i], function(remoteId, callback) {
                    callback(changedItems[i].remoteVersion);
                }, settings.merge, settings.upload, function() {
                    loopfn(i + 1);
                });
            };
            loopfn(0);
        });
    }, syncable.uncache = function(filter, callback) {
        var result = [];
        for (var li in localIndex) {
            var item = localIndex[li];
            (!filter || filter(localIndex[li])) && (delete localIndex[li], delete remoteIndex[item.remoteId], 
            settings.bulkSave || settings.removeFromDb(item));
        }
        settings.bulkSave && settings.saveAllToDb(localIndex), callback(result);
    }, syncable.getItems = function(filter, callback) {
        var result = [];
        for (var li in localIndex) (!filter || filter(localIndex[li])) && result.push(localIndex[li]);
        callback(result);
    }, this;
};