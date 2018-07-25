export declare class Element {
    tag: string;
    el: HTMLElement;
    _data: {
        [key: string]: any;
    };
    _clickOutside: any;
    constructor(tag?: string);
    data(key: string, value?: any): any;
    on(eventName: string, handler: (evt: any) => any): Element;
    onClickOutside(cb: () => void): Element;
    parent(): any;
    class(name: string): Element;
    attrs(map?: {
        [key: string]: string;
    }): Element;
    attr(attr: string, value?: any): any;
    removeAttr(attr: string): Element;
    offset(): any;
    clearStyle(): this;
    styles(map?: {
        [key: string]: string;
    }, isClear?: boolean): Element;
    style(key: string, value?: any): any;
    contains(el: any): boolean;
    removeStyle(key: string): void;
    children(cs: Array<HTMLElement | string | Element>): Element;
    child(c: HTMLElement | string | Element): Element;
    html(html?: string): string | this;
    val(v?: string): any;
    clone(): any;
    isHide(): boolean;
    toggle(): void;
    disabled(): Element;
    able(): Element;
    active(flag?: boolean): Element;
    deactive(): Element;
    isActive(): boolean;
    addClass(cls: string): Element;
    removeClass(cls: string): this;
    hasClass(cls: string): boolean;
    show(isRemove?: boolean): Element;
    hide(): Element;
}
export declare function h(tag?: string): Element;
