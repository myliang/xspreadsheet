import { Format } from './format';
import { Font } from './font';
import { Formula } from './formula';
import { Cell } from './cell';
import { Select } from './select';
export interface Row {
    height: number;
}
export interface Col {
    title: string;
    width: number;
}
export interface MapInt<T> {
    [key: number]: T;
}
export declare class History {
    type: 'rows' | 'cols' | 'cells';
    values: Array<[Array<any>, any, any]>;
    constructor(type: 'rows' | 'cols' | 'cells');
    add(keys: Array<any>, oldValue: any, value: any): void;
}
export declare type StandardCallback = (rindex: number, cindex: number, cell: Cell) => void;
export interface SpreadsheetData {
    rowHeight?: number;
    colWidth?: number;
    rows?: MapInt<Row>;
    cols?: MapInt<Col>;
    cell: Cell;
    cells?: MapInt<MapInt<Cell>>;
    [prop: string]: any;
}
export interface SpreadsheetOptions {
    formats?: Array<Format>;
    fonts?: Array<Font>;
    formulas?: Array<Formula>;
    data?: SpreadsheetData;
}
export declare class Spreadsheet {
    formats: Array<Format>;
    fonts: Array<Font>;
    formulas: Array<Formula>;
    data: SpreadsheetData;
    private histories;
    private histories2;
    private currentCellIndexes;
    select: Select | null;
    private copySelect;
    private cutSelect;
    change: (data: SpreadsheetData) => void;
    constructor(options?: SpreadsheetOptions);
    buildSelect(startTarget: any, endTarget: any): Select;
    defaultRowHeight(): number;
    defaultColWidth(): number;
    copy(): void;
    cut(): void;
    paste(cb: StandardCallback, state: 'copy' | 'cut' | 'copyformat', clear: StandardCallback): void;
    insert(type: 'row' | 'col', amount: number, cb: StandardCallback): void;
    batchPaste(arrow: 'bottom' | 'top' | 'left' | 'right', startRow: number, startCol: number, stopRow: number, stopCol: number, seqCopy: boolean, cb: StandardCallback): void;
    private copyCell;
    isRedo(): boolean;
    redo(cb: StandardCallback): boolean;
    isUndo(): boolean;
    undo(cb: StandardCallback): boolean;
    resetByHistory(v: History, cb: StandardCallback, state: 'undo' | 'redo'): void;
    clearformat(cb: StandardCallback): void;
    merge(ok: StandardCallback, cancel: StandardCallback, other: StandardCallback): void;
    cellAttr(key: keyof Cell, value: any, cb: StandardCallback): void;
    cellText(value: any, cb: StandardCallback): Cell | null;
    currentCell(indexes?: [number, number]): Cell | null;
    cell(rindex: number, cindex: number, v: any, isCopy?: boolean): Cell;
    getCell(rindex: number, cindex: number): Cell | null;
    getFont(key: string | undefined): Font;
    getFormat(key: string | undefined): Format;
    row(index: number, v?: number): Row;
    rows(isData: boolean): Array<Row>;
    col(index: number, v?: number): Col;
    cols(): Array<Col>;
}
