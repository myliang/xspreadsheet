import { Element } from "./base/element";
export declare class Resizer {
    vertical: boolean;
    change: (index: number, distance: number) => void;
    el: Element;
    resizer: Element;
    resizerLine: Element;
    moving: boolean;
    index: number;
    constructor(vertical: boolean, change: (index: number, distance: number) => void);
    set(target: any, index: number, scroll: number): void;
    mousedown(evt: any): void;
}
