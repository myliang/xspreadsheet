import { Spreadsheet, SpreadsheetOptions, SpreadsheetData } from '../core/index'
import '../style/index.less'
import { Cell, getStyleFromCell } from '../core/cell';
import { Format } from '../core/format';
import { Font } from '../core/font';
import { Editor } from './editor';
import { Selector } from './selector';
import { Table } from './table';
import { Toolbar } from './toolbar';
import { Editorbar } from './editorbar';
import { h, Element } from './base/element'

export interface Options extends SpreadsheetOptions {
  height?: () => number;
  mode?: 'design' | 'write' | 'read';
}

export class LocalSpreadsheet {
  ss: Spreadsheet;
  refs: {[key: string]: HTMLElement} = {};
  table: Table;
  toolbar: Toolbar | null = null;
  editorbar: Editorbar | null = null;

  bindEl: HTMLElement
  options: Options;

  _change: (data: SpreadsheetData) => void = () => {}

  constructor (el: HTMLElement, options: Options = {}) {
    this.bindEl = el
    this.options = Object.assign({mode: 'design'}, options)

    // clear content in el
    this.bindEl && (this.bindEl.innerHTML = '')

    this.ss = new Spreadsheet(options);
    // console.log('::::>>>select:', this.ss.select)
    if (this.options.mode === 'design') {
      this.editorbar = new Editorbar()
      this.editorbar.change = (v) => this.editorbarChange(v)

      this.toolbar = new Toolbar(this.ss);
      this.toolbar.change = (key, v) => this.toolbarChange(key, v)
      this.toolbar.undo = () => {
        // console.log('undo::')
        return this.table.undo()
      }
      this.toolbar.redo = () => {
        // console.log('redo::')
        return this.table.redo()
      }
    }

    let bodyHeightFn = (): number => {
      if (this.options.height) {
        return this.options.height()
      }
      return document.documentElement.clientHeight - 24 - 41 - 26
    }
    let bodyWidthFn = (): number => {
      return this.bindEl.offsetWidth
    }
    this.table = new Table(this.ss, Object.assign({height: bodyHeightFn, width: bodyWidthFn, mode: this.options.mode}));
    this.table.change = (data) => {
      this.toolbar && this.toolbar.setRedoAble(this.ss.isRedo())
      this.toolbar && this.toolbar.setUndoAble(this.ss.isUndo())
      this._change(data)
    }
    this.table.editorChange = (v) => this.editorChange(v)
    this.table.clickCell = (rindex, cindex, cell) => this.clickCell(rindex, cindex, cell)
    this.render();
  }

  loadData (data: SpreadsheetData): LocalSpreadsheet {
    // reload until waiting main thread
    setTimeout(() => {
      this.ss.data = data
      this.table.reload()
    }, 1)
    return this
  }

  change (cb: (data: SpreadsheetData) => void): LocalSpreadsheet {
    this._change = cb
    return this;
  }

  private render (): void {
    this.bindEl.appendChild(h().class('spreadsheet').children([
      h().class('spreadsheet-bars').children([
        this.toolbar && this.toolbar.el || '',
        this.editorbar && this.editorbar.el || '',
      ]),
      this.table.el
    ]).el);
  }

  private toolbarChange (k: keyof Cell, v: any) {
    if (k === 'merge') {
      this.table.merge();
      return;
    } else if (k === 'clearformat') {
      this.table.clearformat();
      return ;
    } else if (k === 'paintformat') {
      this.table.copyformat();
      return ;
    }

    this.table.setCellAttr(k, v);
  }

  private editorbarChange (v: Cell) {
    this.table.setValueWithText(v)
  }

  private editorChange (v: Cell) {
    this.editorbar && this.editorbar.setValue(v)
  }

  private clickCell (rindex: number, cindex: number, v: Cell | null) {
    const cols = this.ss.cols()
    this.editorbar && this.editorbar.set(`${cols[cindex].title}${rindex + 1}`, v)
    this.toolbar && this.toolbar.set(this.table.td(rindex, cindex), v)
  }

}
