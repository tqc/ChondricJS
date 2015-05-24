export class RouteCollection {
    constructor() {
        this.routeClasses = {};        
    }
    register(routeClass) {
        if (routeClass["default"]) routeClass = routeClass["default"];
        // todo: find annotation with type Route properly
        var annotation = routeClass.annotations[0];
        this.routeClasses[annotation.route] = routeClass;
    }
    getPageForRoute(route) {
        for (var k in this.routeClasses) {
            var rc = this.routeClasses[k];
            var annotation = rc.annotations[0];
            var match = true;
            var params = {};
            for (let i = 0; i < annotation.routeArray.length; i++) {
                var ra = annotation.routeArray[i];
                var rp = annotation.parameterNames[i];
                var c = route[i];
                if (!ra) {
                    // ignore initial slash
                    continue;
                } else if (rp && c) {
                    // anything other than blank is a valid parameter value
                    params[rp] = c;
                } else if (ra == c) {
                    // literal match
                    continue;
                } else {
                    // route not matched
                    match = false;
                    break;
                }
            }

            if (match) {
                // match found
                this.route = route;
                var subroute = route.slice(annotation.routeArray.length);
                // todo: get from cache if section is already open
                var section = new rc();
                for (let pn in params) {
                    section[pn] = params[pn];
                }
                var newPage = section.getPageForRoute(subroute);
                
                return newPage;
            }
        }
    }
}
