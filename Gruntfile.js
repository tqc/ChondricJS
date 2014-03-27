module.exports = function(grunt) {

    var jsfiles = [
        "src/app.js",
        "src/view.js",
        "src/versioneddatabase.js",
        "src/directives/ng-tap.js",
        "src/directives/cjs-popover.js",
        "src/directives/cjs-popup.js",
        "src/directives/preview-controls.js",
        "src/directives/chondric-viewport.js",
        "src/genericsync.js"
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
                    "built/chondric.js": jsfiles
                }
            }
        },
        cssmin: {
            combine: {
                files: {
                    'built/chondric.min.css': ['src/app.css']
                }
            }
        },
        copy: {
            main: {
                src: 'src/app.css',
                dest: 'built/chondric.css',
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    // Default task(s).
    grunt.registerTask('default', ['uglify:min', "concat", "cssmin", "copy"]);

};