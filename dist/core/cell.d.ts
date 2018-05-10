export interface Cell {
    font?: string;
    format?: string;
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    backgroundColor?: string;
    align?: string;
    valign?: string;
    wordWrap?: boolean;
    visable?: boolean;
    rowspan?: number;
    colspan?: number;
    text?: string;
    merge?: [number, number];
    [key: string]: any;
}
export declare const defaultCell: Cell;
export declare function getStyleFromCell(cell: Cell | null): {
    [key: string]: string;
};
