export interface Format {
    key: string;
    title: string;
    label?: string;
    render(txt: string): string;
}
export declare const formatRenderHtml: (key: string | undefined, txt: string | undefined) => string;
export declare const formats: Array<Format>;
