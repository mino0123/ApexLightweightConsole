module.exports = function (grunt) {

  grunt.config('closure-compiler.script', {
    closurePath: './closure-compiler',
    js: ['src/*'],
    jsOutputFile: 'ApexLightweightConsole.user.js',
    options: {},
    noreport: true
  });

  grunt.config('concat.script', {
    options: {banner: grunt.file.read('bannar.txt')},
    src: ['node_modules/requirejs/require.js', 'ApexLightweightConsole.user.js'],
    dest: 'ApexLightweightConsole.user.js'
  });

  grunt.config('watch.script', {
    files: ['src/*.js'],
    tasks: ['default']
  });

  grunt.registerTask('default', ['closure-compiler', 'concat']);

  grunt.loadNpmTasks('grunt-closure-compiler');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');

};