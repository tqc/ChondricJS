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


        if(fs.existsSync(path.resolve(appdir, "app.css"))) {
            console.log("app.css already exists - skipping");
        } else {
            // create app css
            fs.writeFile(path.resolve(appdir, "app.css"), "");
        }

        var pagetemplatepath = appdef.pageTemplate ? path.resolve(path.dirname(require.main.filename), appdef.pageTemplate) : path.resolve(chondricdir, "templates/page.html");

        var apphtmltemplatepath = fs.existsSync(path.resolve(appdir, "index.html")) ? path.resolve(appdir, "index.html") : path.resolve(chondricdir, "templates/app.html");

        // load templates
        fs.readFile(pagetemplatepath, "utf8", function(err, pagehtmltemplate) {
            fs.readFile(path.resolve(chondricdir, "templates/page.js"), "utf8", function(err, pagejstemplate) {
                fs.readFile(apphtmltemplatepath, "utf8", function(err, apphtmltemplate) {
                    fs.readFile(path.resolve(chondricdir, "templates/app.js"), "utf8", function(err, appjstemplate) {
                        fs.readFile(path.resolve(chondricdir, "templates/db.js"), "utf8", function(err, dbjstemplate) {


                            // create pages
                            for(var i = 0; i < appdef.pages.length; i++) {

                                var jspath = path.resolve(appdir, appdef.pages[i].id + ".js");
                                var htmlpath = path.resolve(appdir, appdef.pages[i].id + ".html");

                                if(fs.existsSync(jspath)) {
                                    console.log(appdef.pages[i].id + ".js already exists - skipping");
                                } else {
                                    var js = pagejstemplate.replace(/__PAGEID__/g, appdef.pages[i].id).replace(/__PREVPAGEID__/g, i > 0 ? appdef.pages[i - 1].id : "").replace(/__NEXTPAGEID__/g, i < appdef.pages.length - 1 ? appdef.pages[i + 1].id : "");

                                    fs.writeFile(jspath, js);
                                }

                                if(fs.existsSync(htmlpath)) {
                                    console.log(appdef.pages[i].id + ".html already exists - skipping");
                                } else {
                                    var html = pagehtmltemplate.replace(/__PAGEID__/g, appdef.pages[i].id).replace(/__TITLE__/g, appdef.pages[i].id);

                                    fs.writeFile(htmlpath, html);

                                }
                            }

                            var scriptrefs = "";

                            for(var i = 0; i < appdef.pages.length; i++) {

                                scriptrefs += "<script src=\"" + appdef.pages[i].id + ".js\"></script>\n"

                            }

                            if(fs.existsSync(path.resolve(appdir, "app.js"))) {
                                console.log("app.js already exists - skipping");
                            } else {

                                var js = appjstemplate.replace(/__TITLE__/g, appdef.title).replace(/__FIRSTPAGETEMPLATE__/g, appdef.pages[0].id);

                                fs.writeFile(path.resolve(appdir, "app.js"), js);
                            }


                            var html = apphtmltemplate.replace(/__TITLE__/g, appdef.title).replace(/<!--BEGIN PAGESCRIPTS-->[\s\S]*<!--END PAGESCRIPTS-->/g, "<!--BEGIN PAGESCRIPTS-->" + scriptrefs + "<!--END PAGESCRIPTS-->");

                            fs.writeFile(path.resolve(appdir, "index.html"), html);



                            if(fs.existsSync(path.resolve(appdir, "db.js"))) {
                                console.log("db.js already exists - skipping");
                            } else {
                                var js = dbjstemplate.replace(/__TITLE__/g, appdef.title);

                                fs.writeFile(path.resolve(appdir, "db.js"), js);
                            }



                            var js = "";
                            var css = "";


                            fs.readFile(path.resolve(chondricdir, "src/app.js"), "utf8", function(err, data) {
                                js += data + "\n\n";
                                fs.readFile(path.resolve(chondricdir, "src/view.js"), "utf8", function(err, data) {
                                    js += data + "\n\n";
                                    fs.readFile(path.resolve(chondricdir, "src/listsync.js"), "utf8", function(err, data) {
                                        js += data + "\n\n";
                                        fs.readFile(path.resolve(chondricdir, "src/versioneddatabase.js"), "utf8", function(err, data) {
                                            js += data + "\n\n";
                                            fs.readFile(path.resolve(chondricdir, "src/app.css"), "utf8", function(err, data) {
                                                css += data + "\n\n";

                                                fs.writeFile(path.resolve(chondricdir, "built/chondric.js"), js);
                                                fs.writeFile(path.resolve(chondricdir, "built/chondric.css"), css);

                                                fs.writeFile(path.resolve(appdir, "lib/chondric.js"), js);
                                                fs.writeFile(path.resolve(appdir, "lib/chondric.css"), css);

                                            });
                                        });
                                    });
                                });
                            })



                        });
                    });
                });
            });
        });



    });

};