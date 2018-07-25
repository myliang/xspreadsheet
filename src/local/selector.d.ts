import { Element } from "./base/element";
import { Spreadsheet } from "../core/index";
import { Table } from './table';
export declare class Selector {
    ss: Spreadsheet;
    table: Table;
    topEl: Element;
    rightEl: Element;
    bottomEl: Element;
    leftEl: Element;
    areaEl: Element;
    cornerEl: Element;
    copyEl: Element;
    el: Element;
    _offset: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
    startTarget: any;
    endTarget: any;
    change: () => void;
    changeCopy: (evt: any, arrow: 'bottom' | 'top' | 'left' | 'right', startRow: number, startCol: number, stopRow: number, stopCol: number) => void;
    constructor(ss: Spreadsheet, table: Table);
    mousedown(evt: any): void;
    setCurrentTarget(target: HTMLElement): void;
    private cornerMousedown;
    reload(): void;
    private setOffset;
    private rowsHeight;
    private colsWidth;
}
export declare class DashedSelector {
    el: Element;
    constructor();
    set(selector: Selector): void;
    hide(): void;
}
