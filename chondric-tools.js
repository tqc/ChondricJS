var path = require('path');
var fs = require('fs');
var mkdirp = require("mkdirp");
//var bower = require("bower");
var crypto = require('crypto');
exports.update = function(apphostdir, appdef) {

    var chondricdir = __dirname;
    var appdir = path.resolve(apphostdir, appdef.htmlPath);
    var generatorLogPath = apphostdir + "/chondric-generator.json";

    console.log("updating app in " + appdir);

    var genlog = {};
    if (fs.existsSync(generatorLogPath)) genlog = JSON.parse(fs.readFileSync(generatorLogPath, "utf8"));

    var generateIfSafe = function(targetPath, generator) {
        var relativePath = path.relative(apphostdir, targetPath);

        // create any folders necessary
        var targetdir = path.dirname(targetPath);
        if (!fs.existsSync(targetdir)) {
            mkdirp.sync(targetdir);
        }

        var targetExists = fs.existsSync(targetPath);
        var previouslyGenerated = genlog[relativePath];

        var resulthash;
        var filehash;

        if (!targetExists || previouslyGenerated) {
            var result = generator();
            resulthash = crypto.createHash('sha1').update(result).digest('hex');

        }

        if (targetExists && !previouslyGenerated) {
            console.log(relativePath + " was created manually - not updating");
            return;
        }

        if (targetExists && previouslyGenerated == resulthash) {
            // templates haven't changed - no need to continue
            return;
        }

        if (targetExists && previouslyGenerated) {
            filehash = crypto.createHash('sha1').update(fs.readFileSync(targetPath, "utf8")).digest('hex');
            if (filehash != previouslyGenerated) {
                if (resulthash != previouslyGenerated) {
                    // only report this if the template or appdef has caused a change
                    console.log(relativePath + " was changed - not updating");
                }
                return;
            }
        }

        // to get to here, file must equal previously generated version
        if (targetExists && filehash != previouslyGenerated) {
            throw ("This should not be possible");
        }

        if (targetExists) {
            console.log(relativePath + " found - updating");
        } else {
            console.log(relativePath + " not found - creating");
        }

        fs.writeFileSync(targetPath, result);
        genlog[relativePath] = resulthash;
        return true;
    }

    var noSubstitution = function(s) {
        return s;
    };
    var standardSubstitution = function(template, appdef, pagedef) {
        var result = template
            .replace(/__APPHOST_NAME__/g, appdef.appHost)
            .replace(/__APPTITLE__/g, appdef.title)
            .replace(/__FIRSTPAGETEMPLATE__/g, appdef.route || appdef.pages[0].route || ("/" + appdef.pages[0].id));

        if (pagedef) {
            result = result
                .replace(/__PAGEID__/g, pagedef.id)
                .replace(/__PAGEROUTE__/g, pagedef.route || ("/" + pagedef.id))
                .replace(/__PREVPAGEID__/g, pagedef.prev)
                .replace(/__NEXTPAGEID__/g, pagedef.next)
                .replace(/__ANGULARMODULES__/g, JSON.stringify(pagedef.angularModules || []))
                .replace(/__ANGULARCONTROLLER__/g, pagedef.angularController)
                .replace(/__PAGETITLE__/g, pagedef.title);
        }
        return result;
    };


    var updateFile = function(targetDir, relTarget, templatePath, substitute, pagedef) {

        // todo: look for a templates folder in app folder first
        var fullTemplatePath = path.resolve(path.resolve(chondricdir, "templates"), templatePath);

        generateIfSafe(path.resolve(targetDir, relTarget), function() {
            var template = fs.readFileSync(fullTemplatePath, "utf8");
            return substitute(template, appdef, pagedef || {});
        });

    }


    if (appdef.appHost) {
        updateFile(apphostdir, "Procfile", "Procfile", standardSubstitution);
        updateFile(apphostdir, appdef.appHost + ".js", "apphost.js", standardSubstitution);
        updateFile(apphostdir, "package.json", "package.jsontemplate", standardSubstitution);
        updateFile(apphostdir, ".env", "template.env", noSubstitution);
        updateFile(apphostdir, ".gitignore", "template.gitignore", noSubstitution);
        updateFile(apphostdir, ".bowerrc", "bowerrc.json", standardSubstitution);
        updateFile(apphostdir, "bower.json", "bower.json", standardSubstitution);
        updateFile(apphostdir, "app.js", "app.js", standardSubstitution);
        updateFile(apphostdir, "db.js", "db.js", standardSubstitution);
    }


    // todo: replace this with a more flexible custom template system
    /*
    if (appdef.pageTemplate) {
        if (updateFile(apphostdir, appdef.pageTemplate, "page.html", noSubstitution)) {
            console.log("Custom page template created. Edit it before continuing to create pages.");
            return;
        }
    }
*/



    mkdirp.sync(path.resolve(appdir, "lib"));

    updateFile(appdir, "splash.html", "splash.html", standardSubstitution);
    updateFile(appdir, "icon.html", "icon.html", standardSubstitution);
    updateFile(appdir, "preview.html", "preview.html", standardSubstitution);
    updateFile(appdir, "app.css", "app.css", standardSubstitution);


    var pagetemplatepath = appdef.pageTemplate ? path.resolve(path.dirname(require.main.filename), appdef.pageTemplate) : path.resolve(chondricdir, "templates/page.html");


    var frameworkscriptrefs = "<script src=\"bower_components/jquery/dist/jquery.min.js\"></script>\n";
    frameworkscriptrefs += "<script src=\"bower_components/angular/angular.min.js\"></script>\n";
    frameworkscriptrefs += "<script src=\"bower_components/angular-sanitize/angular-sanitize.min.js\"></script>\n";
    frameworkscriptrefs += "<script src=\"bower_components/angular-ui-utils/ui-utils.min.js\"></script>\n";
    frameworkscriptrefs += "<link rel=\"stylesheet\" href=\"bower_components/pure/pure-min.css\"/>\n";

    var angularUsed = appdef.useAngular;


    // load templates

    fs.readFile(pagetemplatepath, "utf8", function(err, pagehtmltemplate) {
        fs.readFile(path.resolve(chondricdir, "templates/page.js"), "utf8", function(err, pagejstemplate) {});
    });


    var apphtmltemplatepath = fs.existsSync(path.resolve(appdir, "index.html")) ? path.resolve(appdir, "index.html") : path.resolve(chondricdir, "templates/app.html");
    var apphtmltemplate = fs.readFileSync(apphtmltemplatepath, "utf8");

    var scriptrefs = "";
    // create pages
    for (var i = 0; i < appdef.pages.length; i++) {
        var pagedef = appdef.pages[i];

        var angularController = pagedef.angularController = pagedef.angularController || (pagedef.id + "Ctrl");


        if (!pagedef.scriptless) {
            var jspath = pagedef.id + ".js";
            if (pagedef.folder) jspath = pagedef.folder + "/" + jspath;
            updateFile(appdir, jspath, "page.js", standardSubstitution, pagedef);
            scriptrefs += "<script src=\"" + jspath + "\"></script>\n";
        }

        var htmlpath = pagedef.id + ".html";
        if (pagedef.folder) htmlpath = pagedef.folder + "/" + htmlpath;
        updateFile(appdir, htmlpath, "page.html", standardSubstitution, pagedef);

    }



    var apphtmltemplatepath = fs.existsSync(path.resolve(appdir, "index.html")) ? path.resolve(appdir, "index.html") : path.resolve(chondricdir, "templates/app.html");
    var apphtmltemplate = fs.readFileSync(apphtmltemplatepath, "utf8");
    var html =
        standardSubstitution(apphtmltemplate, appdef)
        .replace(/<!--BEGIN PAGESCRIPTS-->[\s\S]*<!--END PAGESCRIPTS-->/g, "<!--BEGIN PAGESCRIPTS-->" + scriptrefs + "<!--END PAGESCRIPTS-->")
        .replace(/<!--BEGIN FRAMEWORKSCRIPTS-->[\s\S]*<!--END FRAMEWORKSCRIPTS-->/g, "<!--BEGIN FRAMEWORKSCRIPTS-->" + frameworkscriptrefs + "<!--END FRAMEWORKSCRIPTS-->");

    fs.writeFileSync(path.resolve(appdir, "index.html"), html);



    fs.writeFile(path.resolve(appdir, "lib/chondric.js"), fs.readFileSync(path.resolve(chondricdir, "built/chondric.js")));
    fs.writeFile(path.resolve(appdir, "lib/chondric.min.js"), fs.readFileSync(path.resolve(chondricdir, "built/chondric.min.js")));
    fs.writeFile(path.resolve(appdir, "lib/chondric.css"), fs.readFileSync(path.resolve(chondricdir, "built/chondric.css")));
    fs.writeFile(path.resolve(appdir, "lib/chondric.min.css"), fs.readFileSync(path.resolve(chondricdir, "built/chondric.min.css")));


    fs.writeFileSync(generatorLogPath, JSON.stringify(genlog, null, 4));


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