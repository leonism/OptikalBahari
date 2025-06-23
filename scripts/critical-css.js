const critical = require('critical');
const glob = require('glob');

glob('_site/**/*.html', (err, files) => {
  files.forEach(file => {
    critical.generate({
      inline: true,
      base: '_site/',
      src: file.replace('_site/', ''),
      dest: file,
      width: 1300,
      height: 900,
      minify: true,
      extract: true,
      ignore: ['@font-face']
    });
  });
});
