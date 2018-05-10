export interface Formula {
    key: string;
    title: string;
    render(ary: Array<number>): number;
}
export declare const formulaFilterKey: (v: string, filter: (formula: Formula, param: string) => string) => string;
export declare const formulaRender: (v: string, renderCell: (rindex: number, cindex: number) => any) => string;
export declare const formulaReplaceParam: (param: string, rowDiff: number, colDiff: number) => string;
export declare const formulas: Array<Formula>;
