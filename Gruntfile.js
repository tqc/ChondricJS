module.exports = function(grunt) {

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
                    "built/chondric.min.js": ["src/app.js", "src/view.js", "src/versioneddatabase.js", "src/directives/ng-tap.js", "src/directives/preview-controls.js", "src/directives/chondric-viewport.js", "src/genericsync.js"],
                }
            },
            max: {
                options: {
                    beautify: true,
                    mangle: false
                },
                files: {
                    "built/chondric.min.js": ["src/app.js", "src/view.js", "src/versioneddatabase.js", "src/directives/ng-tap.js", "src/directives/preview-controls.js", "src/directives/chondric-viewport.js", "src/genericsync.js"],
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

    // Default task(s).
    grunt.registerTask('default', ['uglify:min', "uglify:max", "cssmin", "copy"]);

};