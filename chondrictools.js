var path = require('path');
var fs = require('fs');
var mkdirp = require("mkdirp");

exports.update = function(appdef) {


    var chondricdir = __dirname;
    var appdir = path.resolve(path.dirname(require.main.filename), appdef.htmlPath)

    console.log("updating app in " + appdir);


    mkdirp(path.resolve(appdir, "lib"), function() {

        // add jquery to lib folder
        fs.createReadStream(path.resolve(chondricdir, "lib/jquery-1.7.1.js")).pipe(fs.createWriteStream(path.resolve(appdir, "lib/jquery-1.7.1.js")));


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
                                    angularUsed = angularUsed || pagedef.useAngular;
                                    var jspath = path.resolve(appdir, appdef.pages[i].id + ".js");
                                    var htmlpath = path.resolve(appdir, appdef.pages[i].id + ".html");
                                    var template = pagejstemplate;
                                    var useAngular = pagedef.useAngular || (appdef.useAngular && pagedef.useAngular !== false);
                                    var angularController = pagedef.angularController || (pagedef.id + "Ctrl");
                                    if (useAngular) template = angularpagejstemplate;

                                    if (fs.existsSync(jspath)) {
                                        console.log(appdef.pages[i].id + ".js already exists - skipping");
                                    } else {
                                        var pagejs = template.replace(/__PAGEID__/g, pagedef.id)
                                            .replace(/__PREVPAGEID__/g, i > 0 ? appdef.pages[i - 1].id : "")
                                            .replace(/__NEXTPAGEID__/g, i < appdef.pages.length - 1 ? appdef.pages[i + 1].id : "")
                                            .replace(/__ANGULARMODULES__/g, JSON.stringify(pagedef.angularModules || []))
                                            .replace(/__ANGULARCONTROLLER__/g, angularController);
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

                                    scriptrefs += "<script src=\"" + appdef.pages[i].id + ".js\"></script>\n";

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


                                var html = apphtmltemplate
                                .replace(/__TITLE__/g, appdef.title)
                                .replace(/<!--BEGIN PAGESCRIPTS-->[\s\S]*<!--END PAGESCRIPTS-->/g, "<!--BEGIN PAGESCRIPTS-->" + scriptrefs + "<!--END PAGESCRIPTS-->")
                                .replace(/<!--BEGIN FRAMEWORKSCRIPTS-->[\s\S]*<!--END FRAMEWORKSCRIPTS-->/g, "<!--BEGIN FRAMEWORKSCRIPTS-->" + frameworkscriptrefs + "<!--END FRAMEWORKSCRIPTS-->");

                                fs.writeFile(path.resolve(appdir, "index.html"), html);


                                if (fs.existsSync(path.resolve(appdir, "db.js"))) {
                                    console.log("db.js already exists - skipping");
                                } else {
                                    var js = dbjstemplate.replace(/__TITLE__/g, appdef.title);

                                    fs.writeFile(path.resolve(appdir, "db.js"), js);
                                }


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
                                                fs.readFile(path.resolve(chondricdir, "src/app.css"), "utf8", function(err, data) {
                                                    frameworkcss += data + "\n\n";
                                                    // todo: this won't work when installed globally - replace with seperate build script
                                                    fs.writeFile(path.resolve(chondricdir, "built/chondric.js"), frameworkjs);
                                                    fs.writeFile(path.resolve(chondricdir, "built/chondric.css"), frameworkcss);

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
            });
        });



    });

};