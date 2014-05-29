"use strict";
module.exports = function(grunt) {

    var jsfiles = [
        "src/core.js",
        "built/template.js",
        "src/versioneddatabase.js",
        "src/directives/ng-tap.js",
        "src/directives/cjs-loading-overlay.js",
        "src/directives/cjs-popover.js",
        "src/directives/cjs-popup.js",
        "src/directives/cjs-sidepanel.js",
        "src/directives/cjs-swipe.js",
        "src/directives/cjs-preview-controls.js",
        "src/directives/chondric-viewport.js",
        "src/directives/cjs-json-template.js",
        "src/sharedui/cjs-action-sheet.js",
        "src/sharedui/cjs-navigation-bar.js",
        "src/sharedui/cjs-tab-footer.js",
        "src/sharedui/cjs-shared-popup.js",
        "src/sharedui/cjs-right-panel.js",
        "src/sharedui/cjs-left-panel.js",
        "src/transitions/crossfade.js",
        "src/transitions/sidepanel.js",
        "src/transitions/slide.js",
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
    ];

    grunt.util.linefeed = '\n';

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        ngtemplates: {
            chondric: {
                cwd: 'src/html',
                src: '**.html',
                dest: 'built/template.js',
                options: {}
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= pkg.version %> */\n'
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
                banner: '/*! <%= pkg.name %> <%= pkg.version %> */\n'
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

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    //    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-angular-templates');
    // Default task(s).
    grunt.registerTask('default', ['ngtemplates', 'uglify:min', "concat", "cssmin"]);

};