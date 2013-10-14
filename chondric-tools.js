var path = require('path');
var fs = require('fs');
var mkdirp = require("mkdirp");


exports.init = function() {
    var chondricdir = __dirname;
    var apphostdir = process.cwd();
    var appdefpath = path.resolve(apphostdir, "appdef.js");

    console.log("init in " + apphostdir);

    if (fs.existsSync(appdefpath)) {
        console.log("appdef.js already exists");
    } else {
        var template = fs.readFileSync(path.resolve(chondricdir, "templates/appdef.js"));
        fs.writeFileSync(appdefpath, template);
        console.log("Created appdef.js");
    }
    console.log("Edit settings in appdef.js then run");
    console.log("node appdef.js");
};


exports.buildFramework = function(chondricdir, callback) {
    var frameworkjs = "";
    var frameworkcss = "";

    fs.readFile(path.resolve(chondricdir, "src/app.js"), "utf8", function(err, data) {
        frameworkjs += data + "\n\n";
        fs.readFile(path.resolve(chondricdir, "src/view.js"), "utf8", function(err, data) {
            frameworkjs += data + "\n\n";
            fs.readFile(path.resolve(chondricdir, "src/listsync.js"), "utf8", function(err, data) {
                frameworkjs += data + "\n\n";
                fs.readFile(path.resolve(chondricdir, "src/versioneddatabase.js"), "utf8", function(err, data) {
                    frameworkjs += data + "\n\n";
                    fs.readFile(path.resolve(chondricdir, "src/module.js"), "utf8", function(err, data) {
                        frameworkjs += data + "\n\n";
                        fs.readFile(path.resolve(chondricdir, "src/genericsync.js"), "utf8", function(err, data) {
                            frameworkjs += data + "\n\n";
                            fs.readFile(path.resolve(chondricdir, "src/app.css"), "utf8", function(err, data) {
                                frameworkcss += data + "\n\n";
                                callback(frameworkjs, frameworkcss);
                            });
                        });
                    });
                });
            });
        });
    });

};

exports.update = function(appdef) {

    var chondricdir = __dirname;

    var appdir = path.resolve(path.dirname(require.main.filename), appdef.htmlPath);

    var apphostdir = path.dirname(require.main.filename);

    console.log("updating app in " + appdir);

    var noSubstitution = function(s) {
        return s;
    };
    var standardSubstitution = function(template, appdef, pagedef) {
        var result = template.replace(/__APPHOST_NAME__/g, appdef.appHost)
                .replace(/__APPTITLE__/g, appdef.title);

        if (pagedef) {
            result = result.replace(/__PAGEID__/g, pagedef.id)
                .replace(/__PREVPAGEID__/g, pagedef.prev)
                .replace(/__NEXTPAGEID__/g, pagedef.next)
                .replace(/__ANGULARMODULES__/g, JSON.stringify(pagedef.angularModules || []))
                .replace(/__ANGULARCONTROLLER__/g, pagedef.angularController)
                .replace(/__PAGETITLE__/g, pagedef.title);
        }
        return result;
    };

    var updateIfMissing = function(destination, templatePath, substitute, pagedef, userTemplatePath) {
        var fulldest = path.resolve(apphostdir, destination);
        if (fs.existsSync(fulldest)) return false;

        var fullTemplatePath = path.resolve(path.resolve(chondricdir, "templates"), templatePath);

        if (userTemplatePath) {
            // if a template was specified in appdef but does not exist, create it
            updateIfMissing(userTemplatePath, templatePath, noSubstitution);
        }

        var template = fs.readFileSync(fullTemplatePath).toString();
        var result = substitute(template, appdef, pagedef || {});

        fs.writeFileSync(fulldest, result);

        return true;
    };


    if (appdef.appHost) {
        updateIfMissing("Procfile", "Procfile", standardSubstitution);
        updateIfMissing(appdef.appHost + ".js", "apphost.js", standardSubstitution);
        updateIfMissing("package.json", "package.jsontemplate", standardSubstitution);
        updateIfMissing(".env", "template.env", noSubstitution);
        updateIfMissing(".gitignore", "template.gitignore", noSubstitution);
    }



    if (appdef.pageTemplate) {
        if (updateIfMissing(appdef.pageTemplate, "page.html", noSubstitution)) {
            console.log("Custom page template created. Edit it before continuing to create pages.");
            return;
        }
    }

    mkdirp(path.resolve(apphostdir, "platformscripts"), function() {

        mkdirp(path.resolve(appdir, "lib"), function() {

            updateIfMissing("apphtml/splash.html", "splash.html", standardSubstitution);
            updateIfMissing("apphtml/icon.html", "icon.html", standardSubstitution);
            updateIfMissing("apphtml/preview.html", "preview.html", standardSubstitution);


            // add jquery to lib folder
            fs.createReadStream(path.resolve(chondricdir, "lib/jquery-1.7.1.js")).pipe(fs.createWriteStream(path.resolve(appdir, "lib/jquery-1.7.1.js")));

            fs.createReadStream(path.resolve(chondricdir, "lib/pure.min.css")).pipe(fs.createWriteStream(path.resolve(appdir, "lib/pure.min.css")));

            if (fs.existsSync(path.resolve(appdir, "app.css"))) {
                console.log("app.css already exists - skipping");
            } else {
                // create app css
                fs.writeFile(path.resolve(appdir, "app.css"), "");
            }

            var pagetemplatepath = appdef.pageTemplate ? path.resolve(path.dirname(require.main.filename), appdef.pageTemplate) : path.resolve(chondricdir, "templates/page.html");

            var apphtmltemplatepath = fs.existsSync(path.resolve(appdir, "index.html")) ? path.resolve(appdir, "index.html") : path.resolve(chondricdir, "templates/app.html");

            var frameworkscriptrefs = "<script src=\"lib/jquery-1.7.1.js\"></script>\n";
            var angularUsed = appdef.useAngular;

            // load templates



            fs.readFile(pagetemplatepath, "utf8", function(err, pagehtmltemplate) {
                fs.readFile(path.resolve(chondricdir, "templates/angularpage.js"), "utf8", function(err, angularpagejstemplate) {
                    fs.readFile(path.resolve(chondricdir, "templates/page.js"), "utf8", function(err, pagejstemplate) {
                        fs.readFile(apphtmltemplatepath, "utf8", function(err, apphtmltemplate) {
                            fs.readFile(path.resolve(chondricdir, "templates/app.js"), "utf8", function(err, appjstemplate) {
                                fs.readFile(path.resolve(chondricdir, "templates/db.js"), "utf8", function(err, dbjstemplate) {

                                    var scriptrefs = "";
                                    // create pages
                                    for (var i = 0; i < appdef.pages.length; i++) {
                                        var pagedef = appdef.pages[i];

                                        if (!pagedef.prev) pagedef.prev = i > 0 ? appdef.pages[i - 1].id : "";

                                        if (!pagedef.next) pagedef.next = i < appdef.pages.length - 1 ? appdef.pages[i + 1].id : "";



                                        angularUsed = angularUsed || pagedef.useAngular;
                                        var jspath = path.resolve(appdir, appdef.pages[i].id + ".js");
                                        var htmlpath = path.resolve(appdir, appdef.pages[i].id + ".html");
                                        var template = pagejstemplate;
                                        var scriptless = appdef.pages[i].scriptless;
                                        var useAngular = pagedef.useAngular || (appdef.useAngular && pagedef.useAngular !== false);
                                        var angularController = pagedef.angularController = pagedef.angularController || (pagedef.id + "Ctrl");
                                        if (useAngular) template = angularpagejstemplate;

                                        if (fs.existsSync(jspath)) {
                                            console.log(appdef.pages[i].id + ".js already exists - skipping");
                                        } else if(!scriptless) {
                                            var pagejs = standardSubstitution(template, appdef, pagedef);

                                            fs.writeFile(jspath, pagejs);
                                        }

                                        if (fs.existsSync(htmlpath)) {
                                            console.log(appdef.pages[i].id + ".html already exists - skipping");
                                        } else {
                                            var pagehtml = pagehtmltemplate.replace(/__PAGEID__/g, appdef.pages[i].id)
                                                .replace(/__TITLE__/g, appdef.pages[i].title)
                                                .replace(/ng-controller="__ANGULARCONTROLLER__"/g, useAngular ? "ng-controller=\"" + angularController + "\"" : "");
                                            fs.writeFile(htmlpath, pagehtml);
                                        }
                                        if (!scriptless) {
                                            scriptrefs += "<script src=\"" + appdef.pages[i].id + ".js\"></script>\n";
                                        }
                                    }

                                    if (fs.existsSync(path.resolve(appdir, "app.js"))) {
                                        console.log("app.js already exists - skipping");
                                    } else {
                                        var appjs = appjstemplate.replace(/__TITLE__/g, appdef.title)
                                            .replace(/__FIRSTPAGETEMPLATE__/g, appdef.pages[0].id);

                                        fs.writeFile(path.resolve(appdir, "app.js"), appjs);
                                    }


                                    if (angularUsed) {
                                        frameworkscriptrefs += "<script src=\"lib/angular.min.js\"></script>\n";
                                        fs.createReadStream(path.resolve(chondricdir, "lib/angular.min.js")).pipe(fs.createWriteStream(path.resolve(appdir, "lib/angular.min.js")));

                                    }


                                    var html = apphtmltemplate.replace(/__TITLE__/g, appdef.title)
                                        .replace(/<!--BEGIN PAGESCRIPTS-->[\s\S]*<!--END PAGESCRIPTS-->/g, "<!--BEGIN PAGESCRIPTS-->" + scriptrefs + "<!--END PAGESCRIPTS-->")
                                        .replace(/<!--BEGIN FRAMEWORKSCRIPTS-->[\s\S]*<!--END FRAMEWORKSCRIPTS-->/g, "<!--BEGIN FRAMEWORKSCRIPTS-->" + frameworkscriptrefs + "<!--END FRAMEWORKSCRIPTS-->");

                                    fs.writeFile(path.resolve(appdir, "index.html"), html);


                                    if (fs.existsSync(path.resolve(appdir, "db.js"))) {
                                        console.log("db.js already exists - skipping");
                                    } else {
                                        var js = dbjstemplate.replace(/__TITLE__/g, appdef.title);

                                        fs.writeFile(path.resolve(appdir, "db.js"), js);
                                    }



                                    exports.buildFramework(chondricdir, function(frameworkjs, frameworkcss) {
                                        fs.writeFile(path.resolve(appdir, "lib/chondric.js"), frameworkjs);
                                        fs.writeFile(path.resolve(appdir, "lib/chondric.css"), frameworkcss);
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

exports.hostApp = function(options) {
    var express = exports.express = require('express');
    var newapp = false;
    var app = options.app;
    if (!app) {
        newapp = true;
        app = express();

        app.use(express.cookieParser());
        app.use(express.session(options.sessionOptions || {
            secret: 'tW876DcNV4B5N33FmVDbBq8h3p8txp'
        }));

        app.use(express.bodyParser());


    }

    var ensureAuthenticated = options.ensureAuthenticated;
    if (!ensureAuthenticated) {
        var authstarter = require("authstarter");
        authstarter.configure(app, options.authOptions);
        ensureAuthenticated = authstarter.ensureAuthenticated;
        exports.authstarter = authstarter;
    }
    app.ensureAuthenticated = ensureAuthenticated;


    app.use("/platformscripts", express.static(process.cwd() + '/platformscripts'));
    var staticMiddleware = express.static(process.cwd() + '/apphtml');


    app.get('/demo*', ensureAuthenticated, function(req, res, next) {
        if (req.path == "/demo") return res.redirect("/demo/index.html");
        req.url = req.url.replace(/^\/demo/, '');
        staticMiddleware(req, res, next);
    });

    if (options.settingsJson) {
        app.get('/settings.json', ensureAuthenticated, options.settingsJson);
    }

    exports.listen = function() {
        var port = process.env.PORT || 5000;
        app.listen(port, function() {
            console.log("Listening on " + port);
        });
    };

    if (newapp && !options.delayListen) {
        exports.listen();
    }

    return app;
};