import { Spreadsheet, SpreadsheetOptions, SpreadsheetData } from '../core/index';
import '../style/index.less';
import { Table } from './table';
import { Toolbar } from './toolbar';
import { Editorbar } from './editorbar';
export interface Options extends SpreadsheetOptions {
    bodyHeight?: () => number;
}
export declare class LocalSpreadsheet {
    ss: Spreadsheet;
    refs: {
        [key: string]: HTMLElement;
    };
    table: Table;
    toolbar: Toolbar;
    editorbar: Editorbar;
    bindEl: HTMLElement;
    options: Options;
    _change: (data: SpreadsheetData) => void;
    constructor(el: HTMLElement, options?: Options);
    loadData(data: SpreadsheetData): LocalSpreadsheet;
    change(cb: (data: SpreadsheetData) => void): LocalSpreadsheet;
    private render;
    private toolbarChange;
    private editorbarChange;
    private editorChange;
    private clickCell;
}
