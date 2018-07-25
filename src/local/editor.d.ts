import { Element } from "./base/element";
import { Suggest } from "./base/suggest";
import { Cell } from "../core/cell";
import { Formula } from "../core/formula";
export declare class Editor {
    defaultRowHeight: number;
    formulas: Array<Formula>;
    el: Element;
    target: HTMLElement | null;
    value: Cell | null;
    editor: Element;
    textarea: Element;
    textline: Element;
    suggest: Suggest;
    change: (v: Cell) => void;
    constructor(defaultRowHeight: number, formulas: Array<Formula>);
    onChange(change: (v: Cell) => void): void;
    set(target: HTMLElement, value: Cell | null): void;
    setValue(value: Cell | null): string;
    setStyle(value: Cell | null): void;
    clear(): void;
    private setTextareaRange;
    private inputKeydown;
    private inputChange;
    private autocomplete;
    reload(): void;
}
