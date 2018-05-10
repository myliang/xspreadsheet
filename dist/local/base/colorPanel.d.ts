import { Element } from "./element";
export declare class ColorPanel extends Element {
    constructor(click: (color: string) => void);
}
export declare function buildColorPanel(click: (color: string) => void): ColorPanel;
