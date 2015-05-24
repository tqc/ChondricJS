
class Directive {
    constructor(options) {
        this.template = options.template;
        this.selector = options.selector;
        this.injections = options.injections || [];
    }
}

// make annotations global so we don't need to import in every single file.
window.Directive = Directive;
