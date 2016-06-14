
//import {ngTap} from "./directives/ng-tap.js";

import {globalify} from "./annotations";

globalify();

// Fix Function#name on browsers that do not support it (IE):
// http://stackoverflow.com/a/17056530/101970
// todo: pretty sure this is no longer needed unless there are pages without a properly defined name.
if (!(function f() { }).name) {
    Object.defineProperty(Function.prototype, 'name', {
        get: function() {
            var name = this.toString().match(/^\s*function\s*(\S*)\s*\(/)[1];
            // For better performance only parse once, and then cache the
            // result through a new accessor for repeated access.
            Object.defineProperty(this, 'name', {
                value: name
            });
            return name;
        }
    });
}

import {App} from "./coreapp.js";
import {Page} from "./page.js";

export {Page, App};


