/*global module:false*/


module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    concat: {
      options: { 
        stripBanners: true
      },
      js: {
        src: ['tmp/**/*.js'],
        dest: 'dist/js/app.js'
      },
      styles: {
        src: ['bower_components/**/*.css', '!bower_components/jquery-ui/**/*.css', '!bower_components/jquery/**/*.css','vendor/**/*.css', 'tmp/styles/**/*.css'],
        dest: 'dist/css/app.css'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        browser: true,
        globals: {
          jQuery: true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile','clean:refresh','build','clean:dist']
      },
      app: {
        files: ['app/**/*.*'],
        tasks: ['build','clean:dist'],
        options: {
            livereload: 35728
        }
      },
      bower: {
        files: 'bower.json',
        tasks: ['bower:install','bower_concat','build']
      },
    },
    connect: {
      server: {
        options: {
          port: 9001,
          base: './dist/',
          open: true,
          livereload: 35728
        }
      }
    },
    coffee: {
      compile: {
        options: {
          join: true
        },
        expand: true,
        cwd: 'app/',
        src: ['**/*.coffee'],
        dest: 'tmp/',
        ext: '.js'
      }
    },
    clean: {
      dist: {
        build: ['./lib','./tmp'],
        force: true  
      },
      refresh: {
        build: ['./lib','./tmp','./dist', './bower_components'],
        force: true
      }
    },
    jade: {
      dist: {
        options: {
          client: false,
          pretty: true  
        },
        files:[{
          cwd: 'app/views',
          expand: true,
          src: ['**/*.jade'],
          dest: 'tmp/views/',
          ext: '.html'
        },
        {
          cwd: 'app',
          expand: true,
          src: ['*.jade'],
          dest: 'dist/',
          ext: '.html'
        }
        ]    
      }
    },
    bower_concat: {
      all: {
        dest: 'dist/js/vendor.js',
        dependencies: {
          'angular': 'jquery'
        },
        exclude: ['animate-css','components-font-awesome']
        
      }
    },
    bower: {
      install: { 
        options: {
          targetDir: './bower_components',
          layout: 'byComponent',
          install: true,
          verbose: true,
          cleanTargetDir: true,
          cleanBowerDir: false,
          bowerOptions: {}
        }
      }
    },
    ngtemplates: {
      dist: {
        options: {
          prefix: '/',
          standalone: true,
          module: 'views',
          url: function(url) {
            return url.replace('tmp/views','views');
          }
        },
        src: 'tmp/views/**/*.html',
        dest: 'dist/js/views.js'
      }
    },
    copy: {
      assets: {
        files: [{expand: true, cwd: 'app/assets',src: ['**/*'], dest: 'dist/'}]
      },
      js: {
        files: [{expand: true, cwd: 'app/',src: ['**/*.js'], dest: 'tmp/'}]
      }
    },
    less: {
      dist: {
        files: {
          'tmp/styles/app.css': 'app/styles/app.less'
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-bower-concat');
  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-contrib-less');
  

  // Default task.
  grunt.registerTask('default', ['clean:refresh','bower:install', 'bower_concat','serve',]);
  grunt.registerTask('build', ['coffee', 'jade', 'ngtemplates', 'less:dist', 'copy:assets', 'copy:js','concat',]);
  grunt.registerTask('serve', ['build','connect','clean:dist','watch']);

}; 
