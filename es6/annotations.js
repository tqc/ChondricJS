
class Directive {
    constructor(options) {
        this.template = options.template;
        this.selector = options.selector;
        this.injections = options.injections || [];
    }
}

class Route {
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
        	}
        	else {
	        	this.parameterNames.push(undefined);
        	}
        }
    }
}

class TestAnnotation {
    constructor(options) {
    }
}

// make annotations global so we don't need to import in every single file.
window.Directive = Directive;
window.Route = Route;
window.TestAnnotation = TestAnnotation;
