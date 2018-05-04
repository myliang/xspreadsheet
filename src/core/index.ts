import { Format, formats } from './format'
import { Font, fonts } from './font'
import { Formula, formulas } from './formula'
import { Cell, defaultCell } from './cell'
import { alphabet } from './alphabet'
import { Select } from './select'

interface Row {
  height: number
}
interface Col {
  title: string
  width: number
}
interface Map<T> {
  [key: number]: T
}
interface MapS<T> {
  [key: string]: T
}
interface SpreadsheetData {
  rowHeight?: number;
  colWidth?: number;
  rows?: Map<Row>;
  cols?: Map<Col>;
  cell: Cell; // global default cell
  cells?: Map<Map<Cell>>;
  [prop: string]: any
}

type StandardCallback = (rindex: number, cindex: number, cell: Cell) => void;

export interface SpreadsheetOptions {
  formats?: Array<Format>;
  fonts?: Array<Font>;
  formulas?: Array<Formula>;
  data?: SpreadsheetData;
}

export class Spreadsheet {
  formats: Array<Format>;
  fonts: Array<Font>;
  formulas: Array<Formula>;
  data: SpreadsheetData;
  private histories: Array<MapS<any>> = [];
  private histories2: Array<MapS<any>> = [];
  private currentCellIndexes: [number, number] = [0, 0];
  select: Select | null = null;
  private copySelect: Select | null = null;
  private cutSelect: Select | null = null;

  constructor (options: SpreadsheetOptions = {}) {
    this.formats = options.formats || formats
    this.fonts = options.fonts || fonts
    this.formulas = options.formulas || formulas
    // init data
    this.data = {rowHeight: 22, colWidth: 100, cell: defaultCell}
    if (options.data) {
      const { data } = options;
      for (let prop of ['rowHeight', 'colWidth', 'rows', 'cols', 'cells']) {
        if (data[prop]) {
          this.data[prop] = data[prop];
        }
      }
      (<any>Object).assign(this.data.cell, data.cell || {});
    }
  }

  // build select
  buildSelect (startTarget: any, endTarget: any) {
    const startAttrs = getElementAttrs(startTarget)
    const endAttrs = getElementAttrs(endTarget)
    // console.log(':::::::>>>', startAttrs, endAttrs)
    let sRow = startAttrs.row
    let sCol = startAttrs.col
    let eRow = endAttrs.row
    let eCol = endAttrs.col
    if (sRow > eRow) {
      sRow = endAttrs.row
      eRow = startAttrs.row
    }
    if (sCol > eCol) {
      sCol = endAttrs.col
      eCol = startAttrs.col
    }
    // calc min, max of row
    // console.log('s: ', sRow, sCol, ', e: ', eRow, eCol)
    let [minRow, maxRow] = calcMinＭaxRow((r: number, c: number) => this.getCell(r, c), sRow, eRow, sCol, eCol)
    // console.log('minRow: ', minRow, ', maxRow: ', maxRow)
    // calc min, max of col
    let [minCol, maxCol] = calcMinMaxCol((r: number, c: number) => this.getCell(r, c), minRow, maxRow, sCol, eCol)
    while (true) {
      const [minr, maxr] = calcMinＭaxRow((r: number, c: number) => this.getCell(r, c), minRow, maxRow, minCol, maxCol)
      let [minc, maxc] = calcMinMaxCol((r: number, c: number) => this.getCell(r, c), minRow, maxRow, minCol, maxCol)
      if (minRow === minr && maxRow === maxr && minCol === minc && maxCol === maxc) {
        break
      }
      minRow = minr
      maxRow = maxr
      minCol = minc
      maxCol = maxc
    }
    const firstCell = this.getCell(minRow, minCol)
    // console.log('first => rowspan: ', firstCell.rowspan, ', colspan: ', firstCell.colspan)
    let canotMerge = minRow + (firstCell && firstCell.rowspan || 1) - 1 === maxRow && minCol + (firstCell && firstCell.colspan || 1) - 1 === maxCol
    // console.log('row: ', minRow, maxRow, ', col:', minCol, maxCol, canotMerge)
    // 计算是否可以merge
    this.select = new Select([minRow, minCol], [maxRow, maxCol], !canotMerge)
    return this.select
  }

  defaultRowHeight (): number {
    return this.data.rowHeight || 22
  }

  defaultColWidth (): number {
    return this.data.colWidth || 100
  }

  copy (): void {
    this.copySelect = this.select
  }
  cut (): void {
    this.cutSelect = this.select
  }
  paste (target: Select, cb: (rindex: number, cindex: number, cell: Cell) => void, copy: 'all' | 'style' = 'all'): void {
    let cselect = this.copySelect
    if (this.cutSelect) {
      cselect = this.cutSelect
      this.cutSelect = null
    }
    if (cselect) {
      target.forEach((rindex, cindex, i, j, rowspan, colspan) => {
        if (cselect) {
          const srcRowIndex = cselect.rowIndex(i)
          const srcColIndex = cselect.colIndex(j)
          const toldCell = this.getCell(rindex, cindex)
          const srcCell = this.getCell(srcRowIndex, srcColIndex)
          if (srcCell) {
            const tcell = this.cell(rindex, cindex, srcCell)
            if (copy === 'style' && toldCell) {
              tcell.text = toldCell.text
            }
            cb(rindex, cindex, tcell)
          }
        }
      })
    }
  }

  redo (): void {
    const { histories, histories2 } = this
    if (histories2.length > 0) {
      const history = histories2.pop()
      if (history) {
        this.setDataByHistory(history)
        histories.push(history)
      }
    }
  }

  undo (): void {
    const { histories, histories2 } = this
    if (histories.length > 0) {
      const history = histories.pop()
      if (history) {
        this.setDataByHistory(history)
        histories2.push(history)
      }
    }
  }

  setDataByHistory (history: MapS<any>) {
    Object.keys(history).forEach(k => {
      let tmp = this.data
      k.split('.').forEach(prop => {
        tmp = this.data[prop]
      })
      tmp = history[k]
    })
  }

  /**
   * 
   * @param ok 合并单元格第一个单元格（左上角）的回调函数
   * @param cancel 取消合并单元格第一个单元格（左上角）的回调函数
   * @param other 其他单元格的回调函数
   */
  merge (ok: StandardCallback, cancel: StandardCallback, other: StandardCallback): void {
    const { select } = this
    // console.log('data.before: ', this.data)
    if (select !== null && select.cellLen() > 1) {
      // merge merge: [rows[0], cols[0]]
      let index = 0
      let firstXY: [number, number] = [0, 0]
      select.forEach((rindex, cindex, i, j, rowspan, colspan) => {
        if (index++ === 0) {
          firstXY = [rindex, cindex]
          let v: Cell = {}
          if (rowspan > 1) v.rowspan = rowspan
          if (colspan > 1) v.colspan = colspan
          // console.log('rowspan:', rowspan, ', colspan:', colspan, select.canMerge)
          if (select.canMerge) {
            let cell = this.cell(rindex, cindex, v, true)
            ok(rindex, cindex, cell)
          } else {
            let cell = this.cell(rindex, cindex, mapFilter(this.getCell(rindex, cindex), 'rowspan', 'colspan', 'merge'))
            cancel(rindex, cindex, cell)
          }
        } else {
          let v: Cell = {invisible: select.canMerge}
          if (select.canMerge) {
            v.merge = firstXY
            let cell = this.cell(rindex, cindex, v, true)
            other(rindex, cindex, cell)
          } else {
            let cell = this.cell(rindex, cindex, mapFilter(this.getCell(rindex, cindex), 'rowspan', 'colspan', 'merge', 'invisible'))
            other(rindex, cindex, cell)
          }
        }
      })
      select.canMerge = !select.canMerge
      // console.log('data:', this.data)
    }
  }
  cellAttr (key: keyof Cell, value: any, cb: StandardCallback): void {
    let v: Cell= {}, history: MapS<any> = {}
    v[key] = value
    const isDefault = value === this.data.cell[key]
    if (this.select !== null) {
      this.select.forEach((rindex, cindex) => {
        let cell = this.cell(rindex, cindex, isDefault ? mapFilter(this.getCell(rindex, cindex), key) : v, !isDefault)
        cb(rindex, cindex, cell)
        history[`${rindex}.${cindex}.${key}`] = value
      })
      this.histories.push(history)
    }
  }
  currentCell (indexes?: [number, number]): Cell | null {
    if (indexes !== undefined) {
      this.currentCellIndexes = indexes
    }
    const [rindex, cindex] = this.currentCellIndexes
    return this.getCell(rindex, cindex)
  }

  cell (rindex: number, cindex: number, v: any, isCopy = false): Cell {
    this.data.cells = this.data.cells || {}
    this.data.cells[rindex] = this.data.cells[rindex] || {}
    this.data.cells[rindex][cindex] = this.data.cells[rindex][cindex] || {}
    if (isCopy) {
      (<any>Object).assign(this.data.cells[rindex][cindex], v)
    } else if (v) {
      this.data.cells[rindex][cindex] = v
    }
    return this.data.cells[rindex][cindex]
  }

  getCell (rindex: number, cindex: number): Cell | null {
    if (this.data.cells && this.data.cells[rindex] && this.data.cells[rindex][cindex]) {
      return this.data.cells[rindex][cindex];
    }
    return null;
  }

  getFont (key: string | undefined) {
    return this.fonts.filter(it => it.key === key)[0]
  }
  getFormat (key: string | undefined) {
    return this.formats.filter(it => it.key === key)[0]
  }

  row (index: number, v?: number): Row {
    const { data } = this;
    if (v !== undefined) {
      data.rows = data.rows || {}
      data.rows[index] = data.rows[index] || {}
      data.rows[index].height = v
    }
    return (<any>Object).assign({height: data.rowHeight}, data.rows ? data.rows[index] : {})
  }
  rows (): Array<Row> {
    const { data } = this;
    let maxRow = mapMaxKey(100, data.rows);
    return range(maxRow, (index) => this.row(index))
  }

  col (index: number, v?: number): Col {
    const { data } = this;
    if (v !== undefined) {
      data.cols = data.cols || {}
      data.cols[index] = data.cols[index] || {}
      data.cols[index].width = v
    }
    return (<any>Object).assign({width: data.colWidth, title: alphabet(index)}, data.cols ? data.cols[index] : {})
  }
  cols (): Array<Col> {
    const { data } = this;
    let maxCol = mapMaxKey(26, data.cols);
    return range(maxCol, (index) => this.col(index));
  }
}

// methods
const mapMaxKey = function<T>(max: number, map: Map<T> | undefined): number {
  if (map) {
    const m = Math.max(...Object.keys(map).map(s => parseInt(s)))
    if (m > max) return m;
  }
  return max;
}
const mapFilter = function(obj: any, ...keys: Array<string>): any {
  const ret: any = {}
  if (obj){
    Object.keys(obj).forEach(e => {
      if (keys.indexOf(e) === -1) {
        ret[e] = obj[e]
      }
    })
  }
  return ret
}
const range = function<T>(stop:number, cb: (index: number) => T): Array<T> {
  const ret = []
  for (let i = 0; i < stop; i++) {
    ret.push(cb(i))
  }
  return ret
}
const getElementAttrs = (target: any) => {
  const { offsetTop, offsetLeft, offsetHeight, offsetWidth } = target
  return {
    row: parseInt(target.getAttribute('row-index')),
    col: parseInt(target.getAttribute('col-index')),
    rowspan: parseInt(target.getAttribute('rowspan')),
    colspan: parseInt(target.getAttribute('colspan')),
    left: offsetLeft,
    top: offsetTop,
    width: offsetWidth,
    height: offsetHeight
  }
}
const calcMinMaxCol = (cell: any, sRow: number, eRow: number, sCol: number, eCol: number) => {
  let minCol = sCol
  let maxCol = eCol
  // console.log(':::::::;start: ', maxCol, minCol)
  for (let j = sRow; j <= eRow; j++) {
    let cCol = sCol
    let dcell = cell(j, cCol)
    if (dcell && dcell.merge) {
      cCol += dcell.merge[1] - cCol
    }
    if (cCol < minCol) minCol = cCol

    cCol = maxCol
    dcell = cell(j, cCol)
    // console.log(j, cCol, dcell && dcell.colspan || 1)
    const cColspan = dcell ? dcell.colspan : 1
    if (parseInt(cColspan) > 1) {
      cCol += parseInt(cColspan)
    } else {
      if (dcell && dcell.merge) {
        // console.log('merge::', maxCol, dcell.merge)
        const [r, c] = dcell.merge
        const rc = cell(r, c).colspan
        cCol += rc + (c - cCol)
      }
    }
    // console.log('cCol: ', cCol, ', maxCol: ', maxCol)
    // console.log(':::::::;end: ', maxCol, minCol)
    if (cCol - 1 > maxCol) maxCol = cCol - 1
  }
  return [minCol, maxCol]
}
const calcMinＭaxRow = (cell: any, sRow: number, eRow: number, sCol: number, eCol: number) => {
  let minRow = sRow
  let maxRow = eRow
  for (let j = sCol; j <= eCol; j++) {
    let cRow = sRow
    let dcell = cell(cRow, j)
    if (dcell && dcell.merge) {
      cRow += dcell.merge[0] - cRow
    }
    if (cRow < minRow) minRow = cRow

    cRow = maxRow
    dcell = cell(cRow, j)
    // console.log('row: ', j, cRow, dcell.rowspan)
    const cRowspan = dcell ? dcell.rowspan : 1
    if (parseInt(cRowspan) > 1) {
      cRow += parseInt(cRowspan)
    } else {
      if (dcell && dcell.merge) {
        const [r, c] = dcell.merge
        const rs = cell(r, c).rowspan
        cRow += rs + (r - cRow)
      }
    }
    if (cRow - 1 > maxRow) maxRow = cRow - 1
  }
  return [minRow, maxRow]
}