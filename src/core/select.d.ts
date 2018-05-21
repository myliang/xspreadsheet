export declare class Select {
    start: [number, number];
    stop: [number, number];
    canMerge: boolean;
    constructor(start: [number, number], stop: [number, number], canMerge: boolean);
    forEach(cb: (r: number, c: number, rindex: number, cindex: number, rowspan: number, colspan: number) => void): void;
    rowIndex(index: number): number;
    colIndex(index: number): number;
    rowLen(): number;
    colLen(): number;
    cellLen(): number;
    contains(rindex: number, cindex: number): boolean;
}
