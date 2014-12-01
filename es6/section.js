import {Page} from "./page";

export class Section extends Page {
    constructor(route, params, options) {
    	super(route, params, options);
        this.isSection = true;
        this.subsections = {};
        this.isBlockPage = false;

        this.template = require("./section.html");
    }
    controller($scope) {

    }
}

Section.isSection = true;