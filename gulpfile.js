var gulp = require('gulp');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');

gulp.task('jscs', function() {
    gulp.src('./es6/index.js')
        .pipe(jscs({
        	"validateIndentation": 5
        }));
});

gulp.task('lint', function() {
    gulp.src(['./*.js', './es6/**/*.js', 'buildtools/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});