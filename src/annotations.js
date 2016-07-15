class Directive_Traceur {
    constructor(options) {
        this.template = options.template;
        this.selector = options.selector;
        this.injections = options.injections || [];
        this.scope = options.scope;
    }
}

class Route_Traceur {
    constructor(options) {
        this.scopeName = options.scopeName;
        this.route = options.route;
        this.params = options.params || [];
        this.parameterNames = [];
        // todo: parse route to extract parameters
        this.routeArray = options.route.split("/");
        for (let i = 0; i < this.routeArray.length; i++) {
            var n = this.routeArray[i];
            if (n[0] == "$") {
                this.parameterNames.push(n.substr(1));
            } else {
                this.parameterNames.push(undefined);
            }
        }
    }
}


function Directive(options) {
    return function(target) {
        target.annotations = [options];
        target.template = options.template;
        target.selector = options.selector;
        target.injections = options.injections || [];
        target.scope = options.scope;

        return target;
    };
}


function Route(options) {
    return function(target) {
        target.annotations = [options];
        target.scopeName = options.scopeName;
        target.route = options.route;
        target.params = options.params || [];
        target.parameterNames = [];
        // todo: parse route to extract parameters
        target.routeArray = options.routeArray = options.route.split("/");
        for (let i = 0; i < target.routeArray.length; i++) {
            var n = target.routeArray[i];
            if (n[0] == "$") {
                target.parameterNames.push(n.substr(1));
            } else {
                target.parameterNames.push(undefined);
            }
        }
    };
}


export function globalify() {
    // make annotations global so we don't need to import in every single file.
    if (typeof $traceurRuntime !== "undefined") {
        window.Directive = Directive_Traceur;
        window.Route = Route_Traceur;
    } else {
        window.Directive = Directive;
        window.Route = Route;
    }

}
globalify();