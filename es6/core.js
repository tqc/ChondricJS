var angular = require('angular');


import {ngTap} from "./directives/ng-tap.js";

export class App {
    constructor(options) {
        this.title = options.title;
        this.moduleName = options.moduleName || "chondric";

        this.module = angular.module(this.moduleName, []);

        this.module.directive('ngTap', ngTap);


    }
    init() {

    }
    start() {
    	var that=this;
        angular.element(document).ready(function() {
            angular.bootstrap(document, [that.moduleName]);
        });
    }
}
