module.exports = function (grunt) {

  grunt.config('concat.script', {
    options: {banner: grunt.file.read('bannar.txt')},
    src: ['src/*'],
    dest: 'ApexLightweightConsole.user.js'
  });

  grunt.config('watch.script', {
    files: ['src/*.js'],
    tasks: ['default']
  });

  grunt.registerTask('default', ['concat']);

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');

};