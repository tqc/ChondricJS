(function() {
    /* Tools to be called from gulp when building a standard app */


    "use strict";
    var gulp = require('gulp');
    //    var server = require('gulp-develop-server');
    var fs = require("fs");
    var path = require("path");
    //   var gaze = require('gaze');

    var browserify = require("browserify");
    var es6ify = require("es6ify");
    var stringify = require('stringify');

    //    var gulptraceur = require("gulp-traceur");
    //    var sourcemaps = require('gulp-sourcemaps');

    var remapify = require("remapify");
    //    var uglifyify = require('uglifyify');
    var exorcist = require("exorcist");
    var uglify = require('gulp-uglify');
    var buffer = require('vinyl-buffer');
    var source = require('vinyl-source-stream');
    var extend = require("extend");

    var tools = module.exports;
    var cwd = process.cwd();

    var sassPath = process.platform === "win32" ? "sass.bat" : "sass";

    var options = {
        serverapp: {

        },
        sourceFolder: "./clientapp",
        cssEntryPoint: "./css/index.scss",
        moduleMappings: {},
        customBrowserifyTransforms: [],
        buildfolder: "./build",
    };

    tools.init = function(opt) {
        extend(options, opt);
        options.moduleMappings.chondric = path.resolve(__dirname, "../es6");


    };

    tools.test = function() {
        console.log("Test function");
    };

    tools.buildVariation = function(variation, env, watch) {


        var debugMode = true;
        console.log("building " + variation + " for " + env);
        var buildfolder = path.resolve(cwd, options.buildfolder);
        var tempFolder = path.resolve(buildfolder, "temp");
        if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);
        var envFolder = path.resolve(buildfolder, env);
        if (!fs.existsSync(envFolder)) fs.mkdirSync(envFolder);
        var varFolder = path.resolve(buildfolder, env, variation);
        if (!fs.existsSync(varFolder)) fs.mkdirSync(varFolder);


        var hostSettings = {};
        extend(hostSettings, options.hostSettings);
        extend(hostSettings, options[env]);
        fs.writeFileSync(path.resolve(tempFolder, "hostsettings.js"), "module.exports="+JSON.stringify(hostSettings), "utf-8");

        var moduleMappings = [{
            src: 'hostsettings.js',
            expose: 'build',
            cwd: tempFolder
        }];
        for (var k in options.moduleMappings) {
            moduleMappings.push({
                src: './**/*.js',
                expose: k,
                cwd: options.moduleMappings[k],
            });
        }

        console.log(moduleMappings);

        var sourceFolder = path.resolve(cwd, options.sourceFolder);

        function buildClientJs() {
            var b = browserify({
                    debug: debugMode
                })
                .add(es6ify.runtime)
                .plugin(remapify, moduleMappings);
            b.transform(stringify({
                extensions: ['.txt', '.html'],
                minify: true
            }));
            for (var i = 0; i < options.customBrowserifyTransforms.length; i++) {
                b = b.transform(options.customBrowserifyTransforms[i]());
            }
            b = b.transform(es6ify);
            //            if (!debugMode) {
            //               b = b.transform({global: true}, "uglifyify");
            //            }
            b = b.require(require.resolve(path.resolve(sourceFolder, variation + ".js")), {
                    entry: true
                })
                .bundle()
                .on('error', function(err) {
                    console.log("Browserify error");
                    console.log(err.message);
                    console.log(err);
                    this.end();
                })
                .on("end", function() {
                    console.log("Done browserify");
                    if (options.afterBrowserify) options.afterBrowserify(varFolder, env, variation);
                });
            if (debugMode) {
                b = b.pipe(exorcist(path.resolve(varFolder, "app.js.map")));
                b.pipe(fs.createWriteStream(path.resolve(varFolder, "app.js")));
            } else {
                b.pipe(source('app.js')) // gives streaming vinyl file object
                    .pipe(buffer()) // <----- convert from streaming to buffered vinyl file object
                    .pipe(uglify())
                    .pipe(gulp.dest(varFolder));
            }
        }

        function copyHtml() {
            gulp.src(sourceFolder + '/*.html')
                .pipe(gulp.dest(varFolder));
        }


        function copyImages() {
            gulp.src(__dirname + '/apphtml/images/**/*')
                .pipe(gulp.dest(options.buildfolder + "/" + env + "/" + variation + "/images"))
                .on("end", function() {
                    gulp.src(process.cwd() + "/images/**/*")
                        .pipe(gulp.dest(options.buildfolder + "/" + env + "/" + variation + "/images"));
                });
        }

        function buildCss() {
            var cssEntryPoint = path.resolve(cwd, options.cssEntryPoint);

            var iesrc = '$browserType: "ie";\n@import "' + cssEntryPoint + '";';

            var ieCssFile = path.resolve(tempFolder, "index-ie.scss");
            fs.writeFileSync(ieCssFile, iesrc);


            // using spawn because libsass sourcemaps are buggy

            var spawn = require("child_process").spawn;
            spawn(sassPath, ["--sourcemap", cssEntryPoint, varFolder + "/app.css"], {
                    cwd: cwd
                })
                .on("close", function(code) {
                    console.log("Done sass build with code " + code);
                });

            spawn(sassPath, ["--sourcemap", ieCssFile, varFolder + "/app-ie.css"], {
                    cwd: cwd
                })
                .on("close", function(code) {
                    console.log("Done sass build for IE with code " + code);
                });
        }

        copyHtml();
        copyImages();
        buildClientJs();
        buildCss();

        if (watch) {

            gaze([
                __dirname + '/clientapp/**/*.html',
                __dirname + '/clientapp/**/*.js',
                process.cwd() + '/src/**/*.js',
                __dirname + "node_modules/chondric-tools/es6/**/*"
            ], function(err, watcher) {
                this.on('all', function(event, filepath) {
                    buildClientJs();
                });
            });

            gaze([
                __dirname + 'clientapp/**/*.scss',
                process.cwd() + '/css/**/*.scss',
                __dirname + "node_modules/chondric-tools/src/css/**/*.scss"
            ], function(err, watcher) {
                this.on('all', function(event, filepath) {
                    buildCss();
                });
            });

            //  gulp.watch('clientapp/*.html', [copyHtml]);


        }
    };

    tools.buildTask = function() {
        var args = process.argv.slice(3);
        if (args.length != 2 || args[0].indexOf("--") !== 0 || args[1].indexOf("--") !== 0) {
            console.log("Invalid arguments for build task");
            console.log("Usage: gulp build --web --dev");
            return;
        }
        var variation = args[0].substr(2);
        var env = args[1].substr(2);


        tools.buildVariation(variation, env);
    };

    /*
        tools.startDevServer = function(callback) {
            server.listen({
                path: 'server'
            });
            if (callback) callback();
        };
    */
})();
