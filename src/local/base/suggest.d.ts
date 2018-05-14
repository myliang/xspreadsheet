import { Element } from "./element";
export declare class Suggest extends Element {
    list: Array<[string, string]>;
    width: number;
    filterList: Array<Element>;
    currentIndex: number;
    itemClick: (it: [string, string]) => void;
    constructor(list: Array<[string, string]>, width: number);
    private documentHandler(e);
    private documentKeydownHandler(e);
    private hideAndRemoveEvents();
    private removeEvents();
    private clickItemHandler(it);
    search(target: Element, word: string): void;
}
