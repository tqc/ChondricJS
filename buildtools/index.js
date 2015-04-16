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
    var filterTransform = require("filter-transform");
    //    var uglifyify = require('uglifyify');
    var exorcist = require("exorcist");
    var uglify = require('gulp-uglify');
    var buffer = require('vinyl-buffer');
    var source = require('vinyl-source-stream');
    var extend = require("extend");

    var chokidar = require('chokidar');

    var tools = module.exports;
    var cwd = process.cwd();

    var sassPath = process.platform === "win32" ? "sass.bat" : "sass";

    var options = {
        serverapp: {

        },
        sourceFolder: "./src",
        libFolder: "./lib",
        cssEntryPoint: "./css/index.scss",
        moduleMappings: {},
        customBrowserifyTransforms: [],
        additionalWatchPaths: [],
        buildfolder: "./build",
        cssVariations: {
            "ie": '$browserType: "ie";'
        },
        imageFolders: ["./src/images"]
    };

    tools.init = function(opt) {
        extend(options, opt);
        options.moduleMappings.chondric = path.resolve(__dirname, "../es6");


    };

    tools.test = function() {
        console.log("Test function");
    };

    tools.buildVariation = function(variation, env, watch, destFolder) {
        var debugMode = env != "prod"; //true;
        if (options.debug !== undefined) debugMode = options.debug;
        if (options[env] && options[env].debug !== undefined) debugMode = options[env].debug;

        console.log("building " + variation + " for " + env);
        var buildfolder = path.resolve(cwd, options.buildfolder);
        if (!fs.existsSync(buildfolder)) fs.mkdirSync(buildfolder);
        var tempFolder = path.resolve(buildfolder, "temp");
        if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);
        var envFolder = path.resolve(buildfolder, env);
        if (!fs.existsSync(envFolder)) fs.mkdirSync(envFolder);
        var varFolder = path.resolve(buildfolder, env, variation);
        if (!fs.existsSync(varFolder)) fs.mkdirSync(varFolder);

        if (destFolder) varFolder = path.resolve(cwd, destFolder);

        var hostSettings = {};
        extend(hostSettings, options.hostSettings);
        extend(hostSettings, options[env]);
        fs.writeFileSync(path.resolve(tempFolder, "hostsettings.js"), "module.exports=" + JSON.stringify(hostSettings), "utf-8");

        var moduleMappings = [{
            src: 'hostsettings.js',
            expose: 'build',
            cwd: tempFolder
        }];
        for (var k in options.moduleMappings) {
            moduleMappings.push({
                src: './**/*.html',
                expose: k,
                cwd: options.moduleMappings[k],
            });
            moduleMappings.push({
                src: './**/*.js',
                expose: k,
                cwd: options.moduleMappings[k],
            });
        }

        console.log(moduleMappings);

        var sourceFolder = path.resolve(cwd, options.sourceFolder);
        var libFolder = path.resolve(cwd, options.libFolder);


        var filteredEs6ify = filterTransform(
            function(file) {
                // todo: This will probably fall over if chondric is not installed with npm link
                // however browserify needs transforms to be global, and compiling es5 modules 
                // breaks stuff.
                // probably need to check against the paths included in moduleMappings.
                if (file.indexOf("node_modules") >= 0) return false;
                return path.extname(file) === '.js'
            },
            es6ify
        )

        function buildClientJs(onComplete) {
            var b = browserify({
                    debug: debugMode,
                    extensions: [".txt", ".html"],
                    //paths: [path.resolve(__dirname,"../es6")]
                })
                .add(es6ify.runtime)
                .plugin(remapify, moduleMappings)
                .transform(stringify({
                    extensions: ['.txt', '.html'],
                    minify: true
                }), {
                    global: true
                });

            for (var i = 0; i < options.customBrowserifyTransforms.length; i++) {
                b = b.transform(options.customBrowserifyTransforms[i]());
            }

            b = b.transform(filteredEs6ify, {
                global: true
            });
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
                    //  this.emit("end");
                })
            b.on("end", function() {
                console.log("Done browserify");
                if (onComplete) onComplete();
                if (options.afterBrowserify) options.afterBrowserify(varFolder, env, variation);
            });
            if (debugMode) {
                //b = b.pipe(exorcist(path.resolve(varFolder, "app.js.map")));
                b = b.pipe(fs.createWriteStream(path.resolve(varFolder, "app.js")))
            } else {
                b = b.pipe(source('app.js')) // gives streaming vinyl file object
                    .pipe(buffer()) // <----- convert from streaming to buffered vinyl file object
                    .pipe(uglify({
                        mangle:true,
                        compress: false
                    }))
                    .pipe(gulp.dest(varFolder));
            }


        }

        function copyHtml() {
            gulp.src(sourceFolder + '/*.html')
                .pipe(gulp.dest(varFolder));
        }

        function copyLib() {
            gulp.src(libFolder + '/*.js')
                .pipe(gulp.dest(varFolder + "/lib"));
        }


        function copyImages() {
            var flatten = require('gulp-flatten');
            console.log("Copying images");
            var globs = [];
            for (var i = 0; i < options.imageFolders.length; i++) {
                var imgf = options.imageFolders[i];
                globs.push(imgf + "/**");
            }

            console.log(globs);
            gulp.src(globs)
                .pipe(flatten())
                .pipe(gulp.dest(varFolder + "/images"));


        }


        //        function copyImages() {
        //            gulp.src(__dirname + '/apphtml/images/**/*')
        //                .pipe(gulp.dest(options.buildfolder + "/" + env + "/" + variation + "/images"))
        //                .on("end", function() {
        //                    gulp.src(process.cwd() + "/images/**/*")
        //                        .pipe(gulp.dest(options.buildfolder + "/" + env + "/" + variation + "/images"));
        //                });
        //        }

        function buildCssFile(inputFile, outputFile) {
            var params = (debugMode ? ["--sourcemap", "--style", "nested"] : ["--style", "compressed"])
                .concat(["-I", ".", inputFile, varFolder + "/" + outputFile]);
            // using spawn because libsass sourcemaps are buggy

            var spawn = require("child_process").spawn;
            var p = spawn(sassPath, params, {
                cwd: cwd
            });
            p.stdout.on('data', function(data) {
                console.log("" + data);
            });

            p.stderr.on('data', function(data) {
                console.log("" + data);
            });
            p.on("close", function(code) {
                console.log("Done sass build of " + inputFile + " with code " + code);
            });

        }

        function buildCss() {
            var cssEntryPoint = path.resolve(cwd, options.cssEntryPoint);

            buildCssFile(cssEntryPoint, "app.css");

            for (var k in options.cssVariations) {
                var iesrc = options.cssVariations[k] + '\n@import "' + (path.relative(tempFolder, cssEntryPoint).replace(/\\/ig, "/")) + '";';
                var ieCssFile = path.resolve(tempFolder, "index-" + k + ".scss");
                fs.writeFileSync(ieCssFile, iesrc);
                buildCssFile(ieCssFile, "app-" + k + ".css");

            }

        }

        buildClientJs(function() {
            copyHtml();
            copyImages();
            copyLib();
            buildCss();
        });

        if (watch) {

            var paths = [
                    path.resolve(__dirname, "../es6"),
                    sourceFolder
                ]
                .concat(options.additionalWatchPaths);

            // watch the css folder if it isn't already watched as part of the source folder
            var cssFolder = path.dirname(path.resolve(cwd, options.cssEntryPoint));
            if (cssFolder.indexOf(sourceFolder) !== 0) paths.push(cssFolder);

            // watch image folders 
            for (var i = 0; i < options.imageFolders.length; i++) {
                var imgf = options.imageFolders[i];
                if (imgf.indexOf(sourceFolder) !== 0) paths.push(imgf);
            }


            var watcher = chokidar.watch(paths, {
                ignored: /[\/\\]\./,
                persistent: true,
                ignoreInitial: true
            });

            watcher.on("all", function(type, file) {
                console.log(type + " event for " + file);
                var ext = path.extname(file);
                if (ext == ".scss") {
                    console.log("CSS needs rebuild");
                    buildCss();
                } else if (ext == ".js" || ext == ".html") {
                    console.log("Browserify package needs rebuild");
                    buildClientJs();
                } else if (ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".gif") {
                    console.log("Updating images");
                    copyImages();

                }
                // if the changed file is .js or .html, need to run browserify
                // copy html only copies a single file, so maybe just include that in the browserify process

                // src/images just needs to be copied if anything changes, and it can't contain anything used by browserify

            });

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
