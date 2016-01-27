(function() {
    /* Tools to be called from gulp when building a standard app */

    "use strict";
    var gulp = require('gulp');
    var fs = require("fs");
    var path = require("path");

    var browserify = require("browserify");
    var es6ify = require("es6ify");
    var stringify = require('stringify');

    var remapify = require("remapify");
    var filterTransform = require("filter-transform");
    var uglify = require('gulp-uglify');
    var buffer = require('vinyl-buffer');
    var vinylSourceStream = require('vinyl-source-stream');
    var extend = require("extend");

    var stripify = require("stripify");

    var chokidar = require('chokidar');

    var async = require("async");

    var tools = module.exports;
    var cwd = process.cwd();

    var sassPath = process.platform === "win32" ? "sass.bat" : "sass";

    var options = {
        globals: {
            angular: "angular",
            jquery: "$",
            d3: "d3"
        },
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
        imageFolders: ["./src/images"],
        legacyBrowserError: {
            title: "App Error",
            message: "This app is designed for use in modern browsers."
        }
    };

    tools.init = function(opt) {
        extend(options, opt);
        options.moduleMappings.chondric = path.resolve(__dirname, "../es6");


    };

    tools.test = function() {
        console.log("Test function");
    };

    tools.buildVariation = function(variation, env, watch, destFolder, onBuildComplete) {
        onBuildComplete = onBuildComplete || function() {};
        var debugMode = env != "prod"; //true;
        if (options.debug !== undefined) debugMode = options.debug;
        if (options[env] && options[env].debug !== undefined) debugMode = options[env].debug;
        console.log("Debug: " + debugMode);
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
                cwd: options.moduleMappings[k]
            });
            moduleMappings.push({
                src: './**/*.js',
                expose: k,
                cwd: options.moduleMappings[k]
            });
        }

        console.log(moduleMappings);

        var sourceFolder = path.resolve(cwd, options.sourceFolder);
        var libFolder = path.resolve(cwd, options.libFolder);


        es6ify.traceurOverrides = {
            annotations: true,
            types: true,
            memberVariables: true
        };



        var filteredEs6ify = filterTransform(
            function(file) {
                // browserify needs transforms to be global, and compiling es5 modules
                // breaks stuff, so only compile the bits we know are es6
                if (file.indexOf("node_modules") >= 0) {
                    // files under node_modules are only compiled as es6 if they are included in
                    // moduleMappings - i.e. if chondric was loaded with npm install rather than npm link
                    for (var i = 0; i < moduleMappings.length; i++) {
                        var pn = moduleMappings[i].cwd.toLowerCase();
                        if (file.toLowerCase().indexOf(pn) === 0 && file.lastIndexOf("node_modules") < pn.length) {
                            return path.extname(file) === '.js';
                        }
                    }
                    return false;
                }
                return path.extname(file) === '.js';


            },
            es6ify
        );

        var globalShim = filterTransform(
            function(file) {
                return path.extname(file) === ".js";
            },
            require('browserify-global-shim').configure(options.globals)
        );


        function buildClientJs(onComplete) {
            var b = browserify(
                {
                    debug: debugMode,
                    extensions: [".txt", ".html"]
                })
                .add(es6ify.runtime, {
                    entry: true
                })
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

            b = b.transform(globalShim, {
                global: true
            });

            if (!debugMode) {
                // remove console.log calls
                b = b.transform({
                    global: true
                }, stripify);
            }
            if (debugMode && options.browserTests) {
                // inject tests
                b.require(require.resolve(path.resolve(cwd, options.browserTests)), {
                    expose: "test",
                    entry: true
                });
            }
            b.require(require.resolve(path.resolve(sourceFolder, variation + ".js")), {
                entry: true
            });

            var statusReporter = require("browserify-build-status");

            b.plugin(statusReporter, {selector: ".chondric-viewport,[chondric-viewport]"});
            b = b.bundle()

            // For use with <script>$.getScript(window.atob ? "app.js" : "app-es3.js");</script>
            fs.writeFileSync(path.resolve(varFolder, "app-es3.js"), statusReporter.getErrorScript(options.legacyBrowserError.title, options.legacyBrowserError.message));

            b.once("error", function(err) {
                console.log(err);
                if (onComplete) onComplete(err);
            });
            b.on("end", function() {
                console.log("Done browserify");
                if (onComplete) onComplete();
            });            

            if (debugMode) {
                b.pipe(statusReporter.writeFile(path.resolve(varFolder, "app.js")));
            } else {
                b = b
                    .pipe(vinylSourceStream('app.js')) // gives streaming vinyl file object
                    .pipe(buffer()) // <----- convert from streaming to buffered vinyl file object
                    .pipe(uglify({
                        mangle: true,
                        compress: false
                    }))
                    .pipe(gulp.dest(varFolder));
            }

        }

        function copyHtml(callback) {
            gulp.src(sourceFolder + '/*.html')
                .pipe(gulp.dest(varFolder))
                .on("end", callback);
        }

        function copyLib(callback) {
            gulp.src(libFolder + '/*.*')
                .pipe(gulp.dest(varFolder + "/lib"))
                .on("end", callback);
        }


        function copyImages(callback) {
            var flatten = require('gulp-flatten');
            console.log("Copying images");
            var globs = [];
            for (var i = 0; i < options.imageFolders.length; i++) {
                var imgf = options.imageFolders[i];
                globs.push(imgf + "/**");
            }
            console.log(globs);
            try {
                var imagemin = require('gulp-imagemin');
                gulp.src(globs)
                    .pipe(flatten())
                    .pipe(imagemin({
                        progressive: true,
                        svgoPlugins: [{
                            removeViewBox: false
                        }]
                    }))
                    .pipe(gulp.dest(varFolder + "/images"))
                    .on("end", callback)
            } catch (ex) {
                // probably just imagemin not being installed - fall back to regular file copy
                console.log("Image optimization failed - copying images unmodified.");
                gulp.src(globs)
                    .pipe(flatten())
                    .pipe(gulp.dest(varFolder + "/images"))
                    .on("end", callback)

            }




        }


        //        function copyImages() {
        //            gulp.src(__dirname + '/apphtml/images/**/*')
        //                .pipe(gulp.dest(options.buildfolder + "/" + env + "/" + variation + "/images"))
        //                .on("end", function() {
        //                    gulp.src(process.cwd() + "/images/**/*")
        //                        .pipe(gulp.dest(options.buildfolder + "/" + env + "/" + variation + "/images"));
        //                });
        //        }

        function buildCssFile(inputFile, outputFile, fileBuilt) {
            var params = (debugMode ? ["--style", "nested"] : ["--style", "compressed"])
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
                if (fileBuilt) fileBuilt(code === 0 ? null : ("SASS Error " + code));
            });

        }

        function buildPreloadCss(onCssBuilt) {
            var cssEntryPoint = path.resolve(cwd, options.cssEntryPoint);
            var preloadCssPath = path.resolve(cssEntryPoint, "../inline.scss");
            console.log(preloadCssPath);
            if (!fs.existsSync(preloadCssPath)) return onCssBuilt && onCssBuilt();

            buildCssFile(preloadCssPath, "inline.css", onCssBuilt);

        }

        function buildCss(onCssBuilt) {
            var cssEntryPoint = path.resolve(cwd, options.cssEntryPoint);


            buildCssFile(cssEntryPoint, "app.css", function(err) {
                if (err) return onCssBuilt && onCssBuilt();

                var variations = [];
                for (var k2 in options.cssVariations) {
                    variations.push({
                        key: k2,
                        settings: options.cssVariations[k2]
                    });
                }

                async.eachSeries(variations, function(v, next) {
                    var iesrc = v.settings + '\n@import "' + (path.relative(tempFolder, cssEntryPoint).replace(/\\/ig, "/")) + '";';
                    var ieCssFile = path.resolve(tempFolder, "index-" + v.key + ".scss");
                    fs.writeFileSync(ieCssFile, iesrc);
                    buildCssFile(ieCssFile, "app-" + v.key + ".css", next);
                }, function() {
                    buildPreloadCss(onCssBuilt);
                });


                // preloader

            });

        }

        function afterBuild(callback) {
            if (options.afterBrowserify) options.afterBrowserify(varFolder, env, variation);
            console.log("Build completed successfully");           
            callback();
        }

        var fullBuild = [buildClientJs, buildCss, copyHtml, copyImages, copyLib, afterBuild];

        async.series(fullBuild, onBuildComplete)

        if (watch) {

            var paths = [path.resolve(__dirname, "../es6"), sourceFolder].concat(options.additionalWatchPaths);

            // watch the css folder if it isn't already watched as part of the source folder
            var cssFolder = path.dirname(path.resolve(cwd, options.cssEntryPoint));
            if (cssFolder.indexOf(sourceFolder) !== 0) paths.push(cssFolder);

            // watch image folders
            for (var i = 0; i < options.imageFolders.length; i++) {
                var imgf = options.imageFolders[i];
                if (imgf.indexOf(sourceFolder) !== 0) paths.push(imgf);
            }

            // watch tests
            if (options.browserTests) {
                paths.push(path.dirname(path.resolve(options.browserTests)));
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
                    async.series([buildCss], function() {})
                } else if (ext == ".js" || ext == ".html") {
                    // if the changed file is .js or .html, need to run browserify
                    console.log("Browserify package needs rebuild");
                    async.series([buildClientJs, afterBuild], function() {})
                } else if (ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".gif") {
                    // src/images just needs to be copied if anything changes, and it can't contain anything used by browserify
                    console.log("Updating images");
                    async.series([copyImages], function() {})
                }
            });

        }
    };

    tools.buildTask = function(cb) {
        var args = process.argv.slice(3);
        if (args.length != 2 || args[0].indexOf("--") !== 0 || args[1].indexOf("--") !== 0) {
            console.log("Invalid arguments for build task");
            console.log("Usage: gulp build --web --dev");
            return;
        }
        var variation = args[0].substr(2);
        var env = args[1].substr(2);


        tools.buildVariation(variation, env, false, null, cb);
    };

})();
