import { Spreadsheet, SpreadsheetOptions, SpreadsheetData } from '../core/index';
import '../style/index.less';
import { Table } from './table';
import { Toolbar } from './toolbar';
import { Editorbar } from './editorbar';
export interface Options {
    d?: SpreadsheetOptions;
    bodyHeight?: () => number;
}
export declare class LocalSpreadsheet {
    el: HTMLElement;
    ss: Spreadsheet;
    refs: {
        [key: string]: HTMLElement;
    };
    table: Table;
    toolbar: Toolbar;
    editorbar: Editorbar;
    change: (data: SpreadsheetData) => void;
    constructor(el: HTMLElement, options?: Options);
    private render;
    private toolbarChange;
    private editorbarChange;
    private editorChange;
    private clickCell;
}
