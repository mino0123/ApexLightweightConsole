module.exports = function (grunt) {

  grunt.config('jshint', {
    options: {
      expr: true,
      scripturl: true,
      evil: true
    },
    src: ['src/**/*.js'],
    concated: ['ApexLightweightConsole.user.js']
  });

  grunt.config('concat.script', {
    options: {banner: grunt.file.read('bannar.txt')},
    src: [
      'src/apex_console.js',
      'src/buffer_list.js',
      'src/csi_api.js',
      'src/css.js',
      'src/loading_image.js',
      'src/log_view.js',
      'src/tooling.js',
      'src/main.js'
    ],
    dest: 'ApexLightweightConsole.user.js'
  });

  grunt.config('watch.script', {
    files: ['src/*.js'],
    tasks: ['default']
  });

  grunt.config('exec.screenshot', {
    cmd: 'casperjs --engine=slimerjs screenshot.js'
  });

  grunt.config('exec.test', {
    cmd: 'casperjs --direct --log-level=warning test test/browser-test.js'
  });

  grunt.registerTask('default', ['concat', 'jshint']);
  grunt.registerTask('screenshot', ['default', 'exec:screenshot']);
  grunt.registerTask('test', ['default', 'exec:test']);

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-exec');

};