import { Element, h } from "./base/element";
import { Spreadsheet } from "../core/index";
import { Cell } from '../core/cell';
import { Table } from './table';
import { buildItem } from './base/item';
import { buildIcon } from './base/icon';
import { buildDropdown } from './base/dropdown';
import { buildMenu } from './base/menu';
import { buildColorPanel } from './base/colorPanel';

export class Toolbar {
  el: Element;

  constructor (public ss: Spreadsheet, public table: Table) {
    // const { formats, fonts, data } = this.ss
    // const defaultCell = data.cell

    // const cellAttrCallback = (rindex: number, cindex: number, cell: Cell) => {
    //   for (let attr of Object.keys(cell)) {
    //     // console.log('attr: ', attr, rindex, cindex, cell)
    //     this.refs[`cell_${rindex}_${cindex}`].style.setProperty(attr, cell[attr])
    //   }
    // }
    // const cellAttrForSelect = (key: keyof Cell, v: any) => {
    //   // console.log(key, ':', v, ', default.value: ', defaultCell[key])
    //   if (defaultCell[key] !== v) {
    //     this.ss.cellAttr(key, v, cellAttrCallback)
    //   }
    // }
    // const cellAttrForToggle = (key: keyof Cell, v: any) => {
    //   const ccell = this.ss.currentCell()
    //   if (defaultCell[key] !== ccell[key]) {
    //     v = defaultCell[key]
    //   }
    //   this.ss.cellAttr(key, v, cellAttrCallback)
    // }

    // const undo = (evt: Event) => {}
    // const redo = (evt: Event) => {}
    // const paintformat = (evt: Event) => {}
    // const clearformat = (evt: Event) => {}
    // const merge = (evt: Event) => {}

    // const addElementToRefs = (key: keyof Cell, ele: HTMLElement) => {
    //   return this.refs[`toolbar_${key}`] = ele
    // }

    this.el = h().class('spreadsheet-toolbar').child(
        buildMenu('horizontal').children([
          this.buildUndo(),
          this.buildRedo(),
          this.buildPaintformat(),
          this.buildClearformat(),
          this.buildFormats(),
          this.buildSeparator(),
          this.buildFonts(),
          this.buildFontSizes(),
          this.buildSeparator(),
          this.buildFontWeight(),
          this.buildFontStyle(),
          this.buildTextDecoration(),
          this.buildColor(),
          this.buildSeparator(),
          this.buildBackgroundColor(),
          this.buildMerge(),
          this.buildSeparator(),
          this.buildAligns(),
          this.buildValigns(),
          this.buildWordWrap()
        ])
      )
    ;
  }

  private buildSeparator (): Element {
    return h().class('spreadsheet-item-separator')
  }
  private buildAligns (): Element {
    return buildDropdown(buildIcon(`align-${this.ss.data.cell.align}`), '60px', [buildMenu().children(
      ['left', 'center', 'right'].map(it => buildItem().child(buildIcon(`align-${it}`).style('text-align', 'center')))
    )])
  }
  private buildValigns (): Element {
    return buildDropdown(buildIcon(`valign-${this.ss.data.cell.valign}`), '60px', [buildMenu().children(
      ['top', 'middle', 'bottom'].map(it => buildItem().child(buildIcon(`valign-${it}`).style('text-align', 'center')))
    )])
  }
  private buildWordWrap (): Element {
    return buildItem().child(buildIcon('textwrap'))
  }
  private buildFontWeight (): Element {
    return buildItem().child(buildIcon('bold'))
  }
  private buildFontStyle (): Element {
    return buildItem().child(buildIcon('italic'))
  }
  private buildTextDecoration (): Element {
    return buildItem().child(buildIcon('underline'))
  }
  private buildMerge (): Element {
    return buildItem().child(buildIcon('merge'))
  }
  private buildColor (): Element {
    return buildDropdown(
      buildIcon('text-color').styles({'border-bottom': `3px solid ${this.ss.data.cell.color}`, 'margin-top': '2px', height: '16px'}),
      'auto',
      [buildColorPanel((color: string) => {})])
  }
  private buildBackgroundColor (): Element {
    return buildDropdown(
      buildIcon('cell-color').styles({'border-bottom': `3px solid ${this.ss.data.cell.backgroundColor}`, 'margin-top': '2px', height: '16px'}),
      'auto',
      [buildColorPanel((color: string) => {})])
  }
  private buildUndo (): Element {
    return buildItem().child(buildIcon('undo'))
  }
  private buildRedo (): Element {
    return buildItem().child(buildIcon('redo'))
  }
  private buildPaintformat (): Element {
    return buildItem().child(buildIcon('paintformat'))
  }
  private buildClearformat (): Element {
    return buildItem().child(buildIcon('clearformat'))
  }
  private buildFormats (): Element {
    return buildDropdown(this.ss.data.cell.format + '', '250px', [buildMenu().children(
      this.ss.formats.map(it => buildItem().children([it.title, h().class('label').child(it.label||'')]))
    )])
  }
  private buildFonts (): Element {
    return buildDropdown(this.ss.data.cell.font + '', '170px', [buildMenu().children(
      this.ss.fonts.map(it => buildItem().child(it.title))
    )])
  }
  private buildFontSizes (): Element {
    return buildDropdown(this.ss.data.cell.fontSize + '', '70px', [buildMenu().children(
      [6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 30, 36].map(it => buildItem().child(`${it}`))
    )])
  }
}