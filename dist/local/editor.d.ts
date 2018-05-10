import { Element } from "./base/element";
import { Cell } from "../core/cell";
export declare class Editor {
    defaultRowHeight: number;
    el: Element;
    target: HTMLElement | null;
    value: Cell | null;
    editor: Element;
    textarea: Element;
    textline: Element;
    change: (v: Cell) => void;
    constructor(defaultRowHeight: number);
    onChange(change: (v: Cell) => void): void;
    set(target: HTMLElement, value: Cell | null): void;
    setValue(value: Cell | null): string;
    setStyle(value: Cell | null): void;
    clear(): void;
    private inputChange(evt);
    reload(): void;
}
