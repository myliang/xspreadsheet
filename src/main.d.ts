import { LocalSpreadsheet, Options } from './local/index';
export default function spreadsheet(el: HTMLElement, options: Options): LocalSpreadsheet;
declare global  {
    interface Window {
        spreadsheet: any;
    }
}
