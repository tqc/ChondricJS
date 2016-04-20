module.exports = function htmlmin(opts) {
    "use strict";
    opts = opts || {};
    var minify = require('html-minifier').minify;

    if (!Array.isArray(opts.extensions)) {
        throw Error('rollup-plugin-htmlmin: `extensions` option should be an array');
    }

    return {
        transform(code, id) {
            let filter = ext => id.indexOf(ext) === id.length - ext.length;

            if (!opts.extensions.filter(filter).length) {
                return null;
            }


            var html = minify(code, opts);
            console.log("Minified " + code.length + " to " + html.length );
            if (html.length == 0) console.log(code);
            return {
                code: 'export default ' + JSON.stringify(html) + ';',
                map: { mappings: '' }
            };
        }
    };
}
