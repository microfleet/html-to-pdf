const spawn = require('child_process').spawn;
const fse = require('fs-extra');
const temp = require('temp');
const path = require('path');
const fs = require('fs');
const duplex = require('duplexify');
const noop = require('lodash/noop');

/**
 * Combines all paths into a single PATH to be added to process.env.
 */
function joinPaths(inputs) {
  return Array.isArray(inputs)
    ? `${inputs.join(':')}:`
    : `${inputs}:`;
}

/**
 * Generates a PDF stream from a LaTeX document.
 *
 * @param {Object} options - Optional compilation specifications.
 *
 * @return {DestroyableTransform}
 */
function latex(options = {}) {
  const { log } = this;
  const duplexStream = duplex();

  /**
   * Emits the given error to the returned output stream.
   */
  function handleErrors(err) {
    log.error('handle error;', err);
    duplexStream.destroy(err);
  }

  /**
   * Emits errors from logs to output stream, and also gives full log to user if requested.
   */
  function printErrors(tempPath, userLogPath) {
    const errorLogPath = path.join(tempPath, 'texput.log');
    const errorLogStream = fs.createReadStream(errorLogPath);

    if (userLogPath) {
      const userLogStream = fs.createWriteStream(userLogPath);

      errorLogStream.pipe(userLogStream);
    }

    const errors = [];

    errorLogStream.on('data', (data) => {
      const lines = data.toString().split('\n');

      lines.forEach((line, i) => {
        if (line.startsWith('! Undefined control sequence.')) {
          errors.push(lines[i - 1]);
          errors.push(lines[i]);
          errors.push(lines[i + 1]);
        } else if (line.startsWith('!')) {
          errors.push(line);
        }
      });
    });

    errorLogStream.on('end', () => {
      const errMessage = `LaTeX Syntax Error\n${errors.join('\n')}`;
      const error = new Error(errMessage);
      handleErrors(error);
    });
  }

  temp.mkdir('node-latex', (err, tempPath) => {
    if (err) {
      return handleErrors(err);
    }

    // The path(s) to your TEXINPUTS.
    const inputs = options.inputs || tempPath;

    // The path(s) to your font inputs for fontspec.
    const fonts = options.fonts || tempPath;

    // The binary command to run (`pdflatex`, `xetex`, etc).
    const cmd = options.cmd || 'pdflatex';

    // The path to where the user wants to save the error log file to.
    const userLogPath = options.errorLogs;

    const args = [
      '-halt-on-error',
    ];

    const opts = {
      cwd: tempPath,
      env: Object.assign({}, process.env, {
        TEXINPUTS: joinPaths(inputs),
        TTFONTS: joinPaths(fonts),
        OPENTYPEFONTS: joinPaths(fonts),
      }),
    };

    /**
     * Returns the PDF stream after the final run.
     */
    function returnDocument() {
      log.info('return document');
      const pdfPath = path.join(tempPath, 'texput.pdf');
      const pdfStream = fs.createReadStream(pdfPath);

      pdfStream.on('end', () => {
        log.info('pdf stream finished');
      });

      duplexStream.setWritable(null);
      duplexStream.setReadable(pdfStream);
      duplexStream.on('close', fse.remove.bind(fse, tempPath, noop));
    }

    /**
     * Runs a LaTeX child process on the document stream
     * and then decides whether it needs to do it again.
     */
    function runLatex(inputStream) {
      const tex = spawn(cmd, args, opts);
      const startupErrorLog = fs.createWriteStream(path.join(tempPath, 'error.log'));

      inputStream.on('end', () => {
        log.info('read stream ended');
      });

      duplexStream.setReadable(inputStream);
      duplexStream.setWritable(tex.stdin);

      // Prevent Node from crashing on compilation error.
      tex.stdin.on('error', handleErrors);

      // Write down errors during the launch -> handle startup error
      tex.stderr.pipe(startupErrorLog);

      tex.on('error', () => {
        handleErrors(new Error(`Error: Unable to run ${cmd} command.`));
      });

      tex.on('exit', (code) => {
        if (code !== 0) {
          printErrors(tempPath, userLogPath);
          return;
        }

        returnDocument();
      });
    }

    // Start the first run.
    return runLatex(duplexStream);
  });

  return duplexStream;
}

module.exports = latex;
