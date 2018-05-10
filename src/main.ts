import { LocalSpreadsheet, Options } from './local/index'

export default function spreadsheet (el: HTMLElement, options: Options) {
  return new LocalSpreadsheet(el, options)
}

declare global{
  interface Window {
    spreadsheet: any;
  }
}

window.spreadsheet = spreadsheet
