import { LocalSpreadsheet, Options } from './local/index';
export default function xspreadsheet(el: HTMLElement, options?: Options): LocalSpreadsheet;
declare global {
    interface Window {
        xspreadsheet: any;
    }
}
