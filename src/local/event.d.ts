export declare function bind<T extends Event>(name: string, fn: (evt: T) => void, target?: any): void;
export declare function unbind<T extends Event>(name: string, fn: (evt: T) => void, target?: any): void;
export declare function mouseMoveUp<T extends Event>(movefunc: (evt: T) => void, upfunc: (evt: T) => void): void;
