import { Element } from "./base/element";
import { Cell } from "../core/cell";
export declare class Editorbar {
    el: Element;
    value: Cell | null;
    textarea: Element;
    label: Element;
    change: (v: Cell) => void;
    constructor();
    set(title: string, value: Cell | null): void;
    setValue(value: Cell | null): void;
    input(evt: any): void;
}
