import { Element } from "./base/element";
import { Table } from "./table";
export declare class ContextMenu {
    table: Table;
    el: Element;
    constructor(table: Table);
    set(evt: any): void;
}
