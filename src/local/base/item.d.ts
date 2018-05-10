import { Element } from "./element";
import { Icon } from "./icon";
export declare class Item extends Element {
    iconEl: Icon | null;
    static build(): Item;
    constructor();
    icon(name: string): this;
    replaceIcon(name: string): void;
}
export declare function buildItem(): Item;
