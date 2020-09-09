var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var browserSync = require('browser-sync').create();
var autoprefix = require("gulp-autoprefixer");
var minifyCSS = require('gulp-minify-css');
var clean = require('gulp-clean');
var critical = require('critical');
var prompt = require('gulp-prompt');
var validUrl = require('valid-url');
var color = require('gulp-color');
var runSequence = require('run-sequence');
var fs = require('fs');
var rsync = require('gulp-rsync');
var minify = require('gulp-minify');
var versionNumber = require('gulp-version-number');
var stripComments = require('gulp-strip-json-comments');
var criticalStream = require('critical').stream;
var log = require('fancy-log');

var CLIENT_FULL_PATH = "https://bigsouth.se/clients/"
var CRITICAL_FILE = "index.html";

var twig = require('gulp-twig');
var data = require('gulp-data');

const versionConfig = {
  'value': '%MDS%',
  'append': {
    'key': 'v',
    'to': ['css', 'js'],
  },
};

function swallowError(error) {
    log.error(error.toString())
    this.emit('end')
}

var paths = {
    html: {
        src: ['./src/**/*.twig', '!./src/**/partials/**/*.twig', '!./src/**/components/**/*.twig'],
        dest: './build/',
    },
    sass: {
        src: 'src/assets/css/**/*.scss',
        dest: 'build/assets/css',
    },
    js: {
        src: ['src/assets/js/**/*.js', '!src/assets/js/external/**/*.js'],
        dest: 'build/assets/js',
    },
    external_js: {
        src: 'src/assets/js/external/**/*.js',
        dest: 'build/assets/js/external',
    },
    css: {
        src: 'src/assets/css/**/*.css',
        dest: 'build/assets/css',
    },
    fonts: {
        src: 'src/assets/css/Fonts/**/*',
        dest: 'build/assets/css/Fonts',
    },
    img: {
        src: 'src/assets/img/*',
        dest: 'build/assets/img',
    },
    favicon: {
        src: 'src/favicon/*',
        dest: 'build/',
    }
}

var criticalParams = {
    inline: true,
    ignore: ['@font-face',/url\(/],
    base: './',
    src: 'build/' + CRITICAL_FILE,
    dest: 'build/' + CRITICAL_FILE,
    minify: true,
    dimensions: [{
      width: 1300,
      height: 900
    }, {
      width: 500,
      height: 900
    }],
};

gulp.task('deploy', function() {
    var fileContent = fs.readFileSync("./package.json", "utf8");
    var props = JSON.parse(fileContent);
    var subdir = props.name;

    log("\nFound project name in package.json: " + color(subdir, 'yellow') + "\n");
    return gulp.src('build/')
        .pipe(prompt.confirm("Deploy to: " + CLIENT_FULL_PATH + color(subdir, 'red') + "?"))
        .pipe(rsync({
            root: 'build/',
            hostname: 'eepnl2-01.nexcess.net',
            username: 'bigsouth',
            destination: 'bigsouth.se/html/clients/' + subdir,
            recursive: true
        }));;
});


gulp.task('critical', ['build'], function(cb) {
    log("Generating critical css for " + color(CRITICAL_FILE, 'yellow'));
    critical.generate(criticalParams);
});

// Generate & Inline Critical-path CSS
gulp.task('critical-multiple', ['build'], function () {
  log("Generating critical css to criticalCSS folder");

  return gulp.src('build/*.html')
    .pipe(criticalStream({
        minify: true,
        base: 'build/',
        inline: false,
        ignore: ['@font-face',/url\(/],
        dimensions: [{
            width: 1300,
            height: 900
          },
          {
            width: 500,
            height: 900
          }],
    }))
    .pipe(gulp.dest('criticalCSS'));
});

gulp.task('critical-watch', ['watch'], function(cb) {
    log("Generating critical css for " + color(CRITICAL_FILE, 'yellow'));
    critical.generate(criticalParams);
});

gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: 'build'
        },
    })
})

gulp.task('clean', function() {
    log("Cleaning build directory");
    return gulp.src('build/', { read: false })
        .on('error', swallowError)
        .pipe(clean());
});

gulp.task('sass', function() {
    return gulp.src(paths.sass.src)
        .pipe(sass({
            sourcemaps: true,
            outputStyle: 'compressed',
        }))
        .on('error', swallowError)
        .pipe(autoprefix("last 2 versions"))
        .on('error', swallowError)
        .pipe(stripComments())
        .on('error', swallowError)
        .pipe(gulp.dest(paths.sass.dest))
        .pipe(browserSync.reload({
            stream: true
        }))
})

gulp.task('html-include', function() {
    return gulp.src(paths.html.src)
        .pipe(data(function(file) {
          return JSON.parse(fs.readFileSync('./site-info.json'));
        }))
        .on('error', swallowError)
        .pipe(twig())
        .on('error', swallowError)
        .pipe(versionNumber(versionConfig))
        .on('error', swallowError)
        .pipe(gulp.dest(paths.html.dest));
});

gulp.task('compile-js', function() {
    log("Moving all .js files in js folder");
    gulp.src(paths.js.src)
        .pipe(sourcemaps.init())
        .pipe(babel())
        .on('error', swallowError)
        .pipe(minify({
            ext: {
                min: '.min.js'
            },
            exclude: ['tasks'],
            ignoreFiles: ['.combo.js', '-min.js']
        }))
        .pipe(sourcemaps.write('.'))
        .on('error', swallowError)
        .pipe(gulp.dest(paths.js.dest))
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('move-external-js', function() {
    log("Moving all .js files in the external js folder");
    gulp.src(paths.external_js.src)
        .on('error', swallowError)
        .pipe(gulp.dest(paths.external_js.dest));
});

gulp.task('move-css', function() {
    log("Moving and minifies all .css files in css folder");
    gulp.src(paths.css.src)
        .pipe(minifyCSS())
        .on('error', swallowError)
        .pipe(gulp.dest(paths.css.dest));
});

gulp.task('move-img', function() {
    log("Moving all images");
    gulp.src(paths.img.src)
        .on('error', swallowError)
        .pipe(gulp.dest(paths.img.dest));
});

gulp.task('move-fonts', function() {
    log("Moving all fonts");
    gulp.src(paths.fonts.src)
        .on('error', swallowError)
        .pipe(gulp.dest(paths.fonts.dest));
});

gulp.task('move-favicon', function() {
    log("Moving all favicons");
    gulp.src(paths.favicon.src)
        .on('error', swallowError)
        .pipe(gulp.dest(paths.favicon.dest));
});

gulp.task('watch', ['browserSync', 'sass', 'move-fonts', 'move-css', 'html-include', 'compile-js', 'move-external-js', 'move-img', 'move-favicon'], function() {
    gulp.watch('src/**/*.scss',['sass','html-include']);
    gulp.watch('src/**/*.twig', ['html-include', browserSync.reload]);
    gulp.watch('site-info.json', ['html-include', browserSync.reload]);
    gulp.watch('src/assets/css/fonts/*', ['move-fonts']);
    gulp.watch('src/assets/css/**/*.css', ['move-css']);
    gulp.watch('src/assets/img/*', ['move-img']);
    gulp.watch('src/assets/js/**/*.js', ['compile-js', 'move-external-js']);
});


gulp.task('build', ['sass', 'move-fonts', 'move-css', 'html-include', 'compile-js', 'move-external-js', 'move-img', 'move-favicon']);
