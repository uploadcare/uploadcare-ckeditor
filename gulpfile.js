'use strict';
/* jshint node: true */

var gulp = require('gulp');
var gutil = require('gulp-util');

var templateCache = require('gulp-angular-templatecache');

var browserSync = require('browser-sync');

var browserify = require('browserify');
var watchify = require('watchify');

var uglify = require('gulp-uglify');

var sourcemaps = require('gulp-sourcemaps');

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');




gulp.task('browserify', function () {
        
    var b = browserify({
        entries: ['./src/plugin.js'],
    });
//    b.transform('debowerify');
    b.on('log', gutil.log);
    b.bundle()
    .pipe(source('plugin.js'))
    .pipe(buffer())
//    .pipe(gulpif(debug, sourcemaps.init({loadMaps: true})))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./'));
});


gulp.task('watchify', function () {
        var b = browserify({
            entries: ['./src/plugin.js'],
            debug: true,
            cache : {},
            packageCache : {},
            verbose: true

        });

        b = watchify(b);

        b.on('update', function() {
            var result = b.bundle()
                .pipe(source('plugin.js'))
                .pipe(buffer())
//                .pipe(gulpif(debug, sourcemaps.init({loadMaps: true})))
//                .pipe(sourcemaps.init({loadMaps: true}))
//                .pipe(uglify())
//                .pipe(sourcemaps.write('./'))
                .pipe(gulp.dest('./'));
    
            gutil.log('updating...', 'watchify');
            return result;
        });
        b.on('log', gutil.log);
        b.on('info', gutil.log);

        return b.bundle()
                .pipe(source('plugin.js'))
                .pipe(buffer())
                .pipe(sourcemaps.init({loadMaps: true}))
                .pipe(uglify())
                .pipe(sourcemaps.write('./'))
                .pipe(gulp.dest('./'));
});

gulp.task('browsersync', ['watchify'], function() {

    browserSync({
        open: false,
        port: 8080,
        server: {
            baseDir: '../../'
        }
    });
    
   gulp.watch(['./src/**/*.js'], browserSync.reload);
});


gulp.task('watch', ['browsersync']);
gulp.task('default', ['watch']);
gulp.task('build', ['browserify']);
