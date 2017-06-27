const glob = require('glob');
const fs = require('fs');
const mu2 = require('mu2');

// NOTE: this is where you can read more about the format
// https://www.sharelatex.com/learn/Learn_LaTeX_in_30_minutes
//
module.exports = function initMustacheToLatex(config) {
  config.tex = Object.create(null);

  // enumerate tex templates
  glob
    .sync('**/*.tex', { cwd: config.latex.templates })
    .reduce((acc, file) => {
      const template = fs.readFileSync(`${config.latex.templates}/${file}`, 'utf8');
      const name = file.slice(0, -4);

      // cb called in a sync fashion
      mu2.compileText(name, template, (err, parsedTemplate) => {
        if (err) throw err;
        acc[name] = parsedTemplate;
      });

      return acc;
    }, config.tex);
};
