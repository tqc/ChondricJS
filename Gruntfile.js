module.exports = function(grunt) {

    var jsfiles = [
        "src/core.js",
        "src/view.js",
        "src/versioneddatabase.js",
        "src/directives/ng-tap.js",
        "src/directives/loading-overlay.js",
        "src/directives/cjs-popover.js",
        "src/directives/cjs-popup.js",
        "src/directives/cjs-sidepanel.js",
        "src/directives/preview-controls.js",
        "src/directives/chondric-viewport.js",
        "src/genericsync.js"
    ];

    var cssfiles = [
        "src/css/core.css",
        "src/css/loading-overlay.css",
        "src/css/icons.css",
        "src/css/modals.css",
        "src/css/transitions/crossfade.css",
        "src/css/transitions/slideleft.css",
        "src/css/transitions/slideright.css",
    ]

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            min: {
                options: {
                    sourceMap: true,
                    mangle: false
                },
                files: {
                    "built/chondric.min.js": jsfiles
                }
            },
            max: {
                options: {
                    beautify: true,
                    mangle: false
                },
                files: {
                    "built/chondric.js": jsfiles
                }
            }
        },
        concat: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            max: {
                files: {
                    "built/chondric.js": jsfiles,
                    "built/chondric.css": cssfiles
                }
            }
        },
        cssmin: {
            combine: {
                files: {
                    'built/chondric.min.css': cssfiles
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    //    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    // Default task(s).
    grunt.registerTask('default', ['uglify:min', "concat", "cssmin"]);

};