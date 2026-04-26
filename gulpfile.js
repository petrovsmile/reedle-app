var gulp = require('gulp');
var concat = require('gulp-concat');

gulp.task('js', function () {
  return gulp.src([
    './app/main.js',
    './app/configs.js',
    './app/stylesheets/application.js',
    './app/stylesheets/home/*.js',
    './app/stylesheets/bookmarks/*.js',
    './app/stylesheets/dictionary/*.js',
    './app/stylesheets/profile/*.js',
    './app/stylesheets/reader/*.js',
    './app/plugins/**/*.js',
    './app/screens/**/*.js',
    './app/render.js',
  ])
    .pipe(concat('App.js'))
    .pipe(gulp.dest('./'));
});

gulp.task('watch', function () {
  gulp.watch('./app/**/**/*.js', gulp.parallel('js'));
});