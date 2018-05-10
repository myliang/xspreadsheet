import { Element } from "./element";
export declare class Icon extends Element {
    img: Element;
    constructor(name: string);
    replace(name: string): void;
}
export declare function buildIcon(name: string): Icon;
