import { Spreadsheet, SpreadsheetOptions } from '../core/index'
// import { 
//   createElement as h, 
//   createIcon as hIcon, 
//   createItem as hItem, 
//   createDropdown as hDropdown, 
//   createMenu as hMenu,
//   createColorPanel as hColorPanel
// } from './dom'
// export function spreadsheet (options: SpreadsheetOptions = {}) {
//   return new Spreadsheet(options)
// }
import '../style/index.less'
import { Cell, getStyleFromCell } from '../core/cell';
import { Format } from '../core/format';
import { Font } from '../core/font';
import { Editor } from './editor';
import { Selector } from './selector';
import { Table } from './table';
import { Toolbar } from './toolbar';
import { Editorbar } from './editorbar';
import { h } from './base/element'

interface Options {
  d?: SpreadsheetOptions;
  bodyHeight?: () => number;
}

export class LocalSpreadsheet {
  ss: Spreadsheet;
  refs: {[key: string]: HTMLElement} = {};
  table: Table;
  toolbar: Toolbar;
  editorbar: Editorbar;

  constructor (public el: HTMLElement, options: Options = {}) {
    this.ss = new Spreadsheet(options.d || {});
    // console.log('::::>>>select:', this.ss.select)
    this.editorbar = new Editorbar()
    this.editorbar.change = (v) => this.editorbarChange(v)

    this.toolbar = new Toolbar(this.ss);
    this.toolbar.change = (key, v) => this.toolbarChange(key, v)

    this.table = new Table(this.ss, options.bodyHeight);
    this.table.editorChange = (v) => this.editorChange(v)
    this.table.clickCell = (rindex, cindex, cell) => this.clickCell(rindex, cindex, cell)

    this.render();
  }

  render (): void {
    this.el.appendChild(h().class('spreadsheet').children([
      h().class('spreadsheet-bars').children([
        this.toolbar.el,
        this.editorbar.el,
      ]),
      // this.hBars(),
      this.table.el
    ]).el);
  }

  private toolbarChange (k: keyof Cell, v: any) {
    this.ss.cellAttr(k, v, (rindex, cindex, cell) => {
      console.log('rindex: ', rindex, ', cindex: ', cindex, cell, getStyleFromCell(cell))
      this.table.td(rindex, cindex).styles(getStyleFromCell(cell), true)
    })
    this.table.editor.setStyle(this.ss.currentCell())
  }

  private editorbarChange (v: Cell) {
    this.table.setValueWithText(v)
  }

  private editorChange (v: Cell) {
    this.editorbar.setValue(v)
  }

  private clickCell (rindex: number, cindex: number, v: Cell) {
    const cols = this.ss.cols()
    this.editorbar.set(`${cols[cindex].title}${rindex + 1}`, v)
    this.toolbar.set(this.table.td(rindex, cindex), v)
  }

}

declare global{
  interface Window {
    spreadsheet: any;
  }
}
window.spreadsheet = LocalSpreadsheet