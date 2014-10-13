var gulp    = require('gulp'),
    bump    = require('gulp-bump'),     // Generates new version.
    argv    = require('yargs')
        .default('release', 'patch')
        .argv,                          // CLI parser.
    fs      = require('fs'),            // Used by bump.
    semver  = require('semver'),        // Used by bump.
    git     = require('gulp-git'),      // Git wrapper.
    jshint  = require('gulp-jshint'),
    phplint = require('phplint'),
    replace = require('gulp-replace'),
    phpcs   = require('gulp-phpcs');

// Parses the package.json file. We use this because its values
// change during execution.
var getPackageJSON = function() {
  return JSON.parse(fs.readFileSync('./package.json', 'utf8'));
};

// PHP lint theme files.
gulp.task('phplint', function() {
  return phplint(['*.php', './classes/**/*.php', './cli/**/*.php', './db/**/*.php', './lang/**/*.php']);
});

// Moodle coding standards.
gulp.task('standards', function() {
  return gulp.src(['*.php', './classes/**/*.php', './cli/**/*.php', './db/**/*.php', './lang/**/*.php'])
    .pipe(phpcs({
      standard: 'moodle'
    }))
    .pipe(phpcs.reporter('log'));
});

// Lint JS.
gulp.task('scripts', function() {
  return gulp.src('./gulpfile.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Integration task. Bumps version and commits.
// Tagging is separate.
gulp.task('integrate', function() {
  var pkg = getPackageJSON();
  var newversion = semver.inc(pkg.version, argv.release);

  gulp.src('./package.json')
  .pipe(bump({version: newversion}))
  .pipe(gulp.dest('./'));

  gulp.src(['./version.php'])
  .pipe(replace(pkg.version, newversion))
  .pipe(gulp.dest('./'));

  gulp.src(['package.json','version.php'])
  .pipe(git.commit(pkg.description + ' v' + newversion, {cwd: './'}));
});

// Tags. Run this after integrating.
gulp.task('tag', function() {
  var pkg = getPackageJSON();
  git.tag('v'+pkg.version, pkg.description + ' v' + pkg.version, function(err) {
  });
});

// Watch.
gulp.task('watch', function() {
  gulp.watch(['*.php', './classes/**/*.php', './cli/**/*.php', './db/**/    *.php', './lang/**/*.php'], ['phplint', 'standards']);
  gulp.watch('./gulpfile.js', ['scripts']);
});
