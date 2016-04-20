// modified to resolve with optional extension or index.js for folders
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));
var fs = _interopDefault(require('fs'));

function alias() {
  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  return {
    resolveId: function (importee, importer) {
      if (Object.keys(options).length === 0) {
        return null;
      }

      var aliasKeys = Object.keys(options);



      // TODO: We shouldn't have a case of double aliases. But may need to handle that better
      var filteredAlias = aliasKeys.filter(function (value) {
        return importee.indexOf(value) === 0;
      })[0];

      if (!filteredAlias) {
        return null;
      }

      console.log("resolving alias " + importee);


      var entry = options[filteredAlias];

      var updatedId = importee.replace(filteredAlias, entry);

      if (updatedId.indexOf('./') === 0 || updatedId.indexOf('/') === 0 || updatedId.indexOf(':') === 1) {
        var basename = path.basename(importer);
        var directory = importer.split(basename)[0];

        var resolved = path.resolve(directory, updatedId)
        if (fs.existsSync(path.resolve(directory, updatedId, "index.js"))) return path.resolve(directory, updatedId, "index.js");
        if (!fs.existsSync(resolved) && fs.existsSync(resolved+".js")) return resolved+".js";


        // TODO: Is there a way not to have the extension being defined explicitly?
        return resolved;
      }

      return updatedId;
    }
  };
}

module.exports = alias;