import {Page} from "./page";

export class Section extends Page {
    constructor(route, params, options) {
    	super(route, params, options);
        this.isSection = true;
        this.subsections = {};

        this.template = "<div ng-repeat=\"rv in rv.subsectionArray | orderBy:'position' track by rv.route \" chondric-viewport=\"1\" class=\"{{rv.templateId}}\" ng-class=\"{'chondric-section': rv.isSection, 'chondric-page': !rv.isSection, active: rv.route == route, next: rv.route == nextRoute, prev: rv.route == lastRoute}\" cjs-transition-style position=\"{{rv.position}}\" route=\"{{rv.route}}\"></div>";
    }
    controller($scope) {

    }
}

Section.isSection = true;