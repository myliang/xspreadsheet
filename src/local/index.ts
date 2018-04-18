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
import { Cell } from '../core/cell';
import { Format } from '../core/format';
import { Font } from '../core/font';
import { Editor } from './editor';
import { Selector } from './selector';
import { Table } from './table';
import { h } from './base/element'

export class LocalSpreadsheet {
  ss: Spreadsheet;
  refs: {[key: string]: HTMLElement} = {};
  table: Table;

  constructor (public el: HTMLElement, options: SpreadsheetOptions = {}) {
    this.ss = new Spreadsheet(options);
    console.log('::::>>>select:', this.ss.select)
    this.table = new Table(this.ss);
    this.render();
  }

  render (): void {
    this.el.appendChild(h().class('spreadsheet').children([
      // this.hBars(),
      this.table.el
    ]).el);
  }

  hBars () {
    const { formats, fonts, data } = this.ss
    const defaultCell = data.cell

    const cellAttrCallback = (rindex: number, cindex: number, cell: Cell) => {
      for (let attr of Object.keys(cell)) {
        // console.log('attr: ', attr, rindex, cindex, cell)
        this.refs[`cell_${rindex}_${cindex}`].style.setProperty(attr, cell[attr])
      }
    }
    const cellAttrForSelect = (key: keyof Cell, v: any) => {
      // console.log(key, ':', v, ', default.value: ', defaultCell[key])
      if (defaultCell[key] !== v) {
        this.ss.cellAttr(key, v, cellAttrCallback)
      }
    }
    const cellAttrForToggle = (key: keyof Cell, v: any) => {
      const ccell = this.ss.currentCell()
      if (defaultCell[key] !== ccell[key]) {
        v = defaultCell[key]
      }
      this.ss.cellAttr(key, v, cellAttrCallback)
    }

    const undo = (evt: Event) => {}
    const redo = (evt: Event) => {}
    const paintformat = (evt: Event) => {}
    const clearformat = (evt: Event) => {}
    const merge = (evt: Event) => {}

    const addElementToRefs = (key: keyof Cell, ele: HTMLElement) => {
      return this.refs[`toolbar_${key}`] = ele
    }

    // return h().class('spreadsheet-bars').children, [
    //   h('div', {className: 'spreadsheet-toolbar'}, [
    //     h('div', {className: 'spreadsheet-menu horizontal'}, [
    //       hItem(undo, [hIcon('undo')]),
    //       hItem(redo, [hIcon('redo')]),
    //       hItem(paintformat, [hIcon('paintformat')]),
    //       hItem(clearformat, [hIcon('clearformat')]),
    //       addElementToRefs('format', hDropdown(data.cell.format + '', '250px', hMenu(
    //         formats.map(f => hItem(cellAttrForSelect.bind(null, 'format', f.key), [f.title, h('div', {className: 'label'}, f.label)]))
    //       ))),
    //       h('div', {className: 'spreadsheet-item-separator'}),
    //       addElementToRefs('font', hDropdown(data.cell.font + '', '170px', hMenu(
    //         fonts.map(f => hItem(cellAttrForSelect.bind(null, 'font', f.key), f.title))
    //       ))),
    //       addElementToRefs('fontSize', hDropdown(data.cell.fontSize + '', '70px', hMenu(
    //         [6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 30, 36].map(_e => hItem(cellAttrForSelect.bind(null, 'fontSize', _e), `${_e}`))
    //       ))),
    //       h('div', {className: 'spreadsheet-item-separator'}),
    //       addElementToRefs('fontWeight', hItem(cellAttrForToggle.bind(null, 'fontWeight', 'bold'), [hIcon('bold')])),
    //       addElementToRefs('fontStyle', hItem(cellAttrForToggle.bind(null, 'fontStyle', 'italic'), [hIcon('italic')])),
    //       addElementToRefs('textDecoration', hItem(cellAttrForToggle.bind(null, 'textDecoration', 'underline'), [hIcon('underline')])),
    //       addElementToRefs('color', hDropdown(hIcon('text-color', {'border-bottom': `3px solid ${data.cell.color}`, 'margin-top': '2px', height: '16px'}), 'auto', hColorPanel((color) => cellAttrForSelect('color', color)))),
    //       h('div', {className: 'spreadsheet-item-separator'}),
    //       addElementToRefs('backgroundColor', hDropdown(hIcon('cell-color', {'border-bottom': `3px solid ${data.cell.backgroundColor}`, 'margin-top': '2px', height: '16px'}), 'auto', hColorPanel((color) => cellAttrForSelect('backgroundColor', color)))),
    //       addElementToRefs('merge', hItem(merge, [hIcon('merge')])),
    //       h('div', {className: 'spreadsheet-item-separator'}),
    //       addElementToRefs('align', hDropdown(hIcon(`align-${data.cell.align}`), '60px', hMenu(
    //         ['left', 'center', 'right'].map(_e => hItem(cellAttrForSelect.bind(null, 'align', _e), [hIcon(`align-${_e}`, {'text-align': 'center'})]))
    //       ))),
    //       addElementToRefs('valign', hDropdown(hIcon(`valign-${data.cell.valign}`), '60px', hMenu(
    //         ['top', 'middle', 'bottom'].map(_e => hItem(cellAttrForSelect.bind(null, 'valign', _e), [hIcon(`valign-${_e}`, {'text-align': 'center'})]))
    //       ))),
    //       addElementToRefs('wordWrap', hItem(cellAttrForToggle.bind(null, 'wordWrap', 'word-wrap'), [hIcon('textwrap')]))
    //     ])
    //   ])
    // ]);
  }

}

declare global{
  interface Window {
    spreadsheet: any;
  }
}
window.spreadsheet = LocalSpreadsheet