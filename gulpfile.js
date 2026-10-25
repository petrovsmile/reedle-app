var gulp = require('gulp');
var concat = require('gulp-concat');
var fs = require('fs');
var path = require('path');
var { Transform } = require('stream');

async function syncIosVersion() {
  const package_info = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const project_path = path.join(__dirname, 'ios/reedle.xcodeproj/project.pbxproj');
  const project_source = fs.readFileSync(project_path, 'utf8');
  const updated_source = project_source.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${package_info.version};`);
  if (updated_source !== project_source) fs.writeFileSync(project_path, updated_source);
}

function findServiceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .sort((first, second) => first.name.localeCompare(second.name))
    .flatMap(entry => {
      const file_path = path.join(directory, entry.name);
      if (entry.isDirectory()) return findServiceFiles(file_path);
      return entry.isFile() && entry.name.endsWith('.js') ? [file_path] : [];
    });
}

function concatenateApp() {
  const service_files = findServiceFiles(path.join(__dirname, 'app/services'));
  return gulp.src([
    ...service_files,
    './app/main.js',
    './app/configs.js',
    './app/stylesheets/application.js',
    './app/stylesheets/home/*.js',
    './app/stylesheets/bookmarks/*.js',
    './app/stylesheets/blog/*.js',
    './app/stylesheets/dictionary/*.js',
    './app/stylesheets/profile/*.js',
    './app/stylesheets/reader/*.js',
    './app/screens/**/*.js',
    './app/render.js',
  ])
    .pipe(concat('App.js'))
    .pipe(new Transform({
      objectMode: true,
      transform(file, encoding, done) {
        const output_path = path.join(__dirname, 'App.js');
        if (fs.existsSync(output_path) && fs.readFileSync(output_path).equals(file.contents)) {
          done();
          return;
        }
        done(null, file);
      }
    }))
    .pipe(gulp.dest('./'));
}

gulp.task('js', gulp.series(syncIosVersion, concatenateApp));

gulp.task('watch', function () {
  gulp.watch(['./app/**/**/*.js', './package.json'], gulp.parallel('js'));
});

gulp.task('default', gulp.series('js', 'watch'));
