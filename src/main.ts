import { LocalSpreadsheet, Options } from './local/index';

export default function xspreadsheet (el: HTMLElement, options?: Options) {
  return new LocalSpreadsheet(el, options)
}

declare global {
  interface Window {
    xspreadsheet: any;
  }
}

window.xspreadsheet = xspreadsheet
