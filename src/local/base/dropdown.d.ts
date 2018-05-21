import { Element } from "./element";
export declare class Dropdown extends Element {
    content: Element;
    title: Element;
    constructor(title: string | Element, width: string, contentChildren: Element[]);
    toggleHandler(evt: Event): void;
}
export declare function buildDropdown(title: string | Element, width: string, contentChildren: Element[]): Dropdown;
