module.exports = function (grunt) {

  grunt.config('requirejs.main.options', {
    name: 'main',
    baseUrl: 'src',
    mainConfigFile: 'src/main.js',
    out: 'ApexLightweightConsole.user.js'
  });

  grunt.config('concat.main', {
    options: {banner: grunt.file.read('bannar.txt')},
    src: ['node_modules/requirejs/require.js', 'ApexLightweightConsole.user.js'],
    dest: 'ApexLightweightConsole.user.js'
  });

  grunt.config('watch.main', {
    files: ['src/*.js'],
    tasks: ['default']
  });

  grunt.registerTask('default', ['requirejs', 'concat']);

  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');

};