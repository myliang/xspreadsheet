import { Format, formats } from './format'
import { Font, fonts } from './font'
import { Formula, formulas, formulaReplaceParam } from './formula'
import { Cell, defaultCell } from './cell'
import { alphabet } from './alphabet'
import { Select } from './select'
import { unbind } from '../local/event';

export interface Row {
  height: number
}
export interface Col {
  title: string
  width: number
}
export interface MapInt<T> {
  [key: number]: T
}
export class History {
  values: Array<[Array<any>, any, any]> = [];
  constructor (public type: 'rows' | 'cols' | 'cells') {}
  add (keys: Array<any>, oldValue: any, value: any) {
    this.values.push([keys, oldValue, value])
  }
}
// types
export type StandardCallback = (rindex: number, cindex: number, cell: Cell) => void;

export interface SpreadsheetData {
  rowHeight?: number;
  colWidth?: number;
  rows?: MapInt<Row>;
  cols?: MapInt<Col>;
  cell: Cell; // global default cell
  cells?: MapInt<MapInt<Cell>>;
  [prop: string]: any
}

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
  private histories: Array<History> = [];
  private histories2: Array<History> = [];
  private currentCellIndexes: [number, number] = [0, 0];
  select: Select | null = null;
  private copySelect: Select | null = null;
  private cutSelect: Select | null = null;

  change: (data: SpreadsheetData) => void = () => {}

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
  paste (cb: StandardCallback, state: 'copy' | 'cut' | 'copyformat', clear: StandardCallback): void {
    let cselect = this.copySelect
    if (this.cutSelect) {
      cselect = this.cutSelect
      this.cutSelect = null
    }
    if (cselect && this.select) {
      const history = new History('cells')
      if (state === 'copyformat') {
        this.select.forEach((rindex, cindex, i, j, rowspan, colspan) => {
          if (cselect) {
            const srcRowIndex = cselect.rowIndex(i)
            const srcColIndex = cselect.colIndex(j)
            const [oldCell, newCell] = this.copyCell(srcRowIndex, srcColIndex, rindex, cindex, state, cb, clear)
            history.add([rindex, cindex], oldCell, newCell)
          }
        })
      } else {
        cselect.forEach((rindex, cindex, i, j, rowspan, colspan) => {
          if (this.select) {
            const destRowIndex = this.select.start[0] + i
            const destColIndex = this.select.start[1] + j
            const [oldCell, newCell] = this.copyCell(rindex, cindex, destRowIndex, destColIndex, state, cb, clear)
            history.add([destRowIndex, destColIndex], oldCell, newCell)
          }
        })
      }
      this.histories.push(history)
      this.change(this.data)
    }
  }
  insert (type: 'row' | 'col', amount: number, cb: StandardCallback) {
    if (this.select) {
      const { cells } = this.data
      const [srindex, scindex] = this.select.start
      if (!cells) return

      // console.log('insert.before.data:', cells)
      const history = new History('cells')
      if (type === 'row') {
        const newCells: MapInt<MapInt<Cell>> = {}
        Object.keys(cells).forEach(key => {
          let rindex = parseInt(key)
          let values = cells[rindex]
          if (srindex <= rindex) {
            Object.keys(values).forEach(key1 => {
              let cindex = parseInt(key1)
              // clear current cell
              cb(rindex, cindex, {})
              history.add([rindex, cindex], values[cindex], undefined)
            
              // set next cell is current celll
              cb(rindex + 1, cindex, values[cindex] || {})
              history.add([rindex + 1, cindex], this.getCell(rindex + 1, cindex), values[cindex])
            })
          }
          newCells[srindex <= rindex ? rindex + 1 : rindex] = cells[rindex]
        })
        this.data.cells = newCells
      } else if (type === 'col') {
        Object.keys(cells).forEach(key => {
          let rindex = parseInt(key)
          let values = cells[rindex]
          let newCell: MapInt<Cell> = {}
          Object.keys(values).forEach(key1 => {
            let cindex = parseInt(key1)
            if (scindex <= cindex) {
              // clear 当前cell
              cb(rindex, cindex, {})
              history.add([rindex, cindex], values[cindex], undefined)
            
              // 设置下一个cell 等于当前的cell
              cb(rindex, cindex + 1, values[cindex] || {})
              history.add([rindex, cindex + 1], this.getCell(rindex, cindex + 1), values[cindex])
            }
            newCell[scindex <= cindex ? cindex + 1 : cindex] = values[cindex]
          })
          cells[rindex] = newCell
        })
      }
      this.histories.push(history)
      // console.log('insert.after.data:', this.data.cells)
    } 
  }

  batchPaste (arrow: 'bottom' | 'top' | 'left' | 'right',
    startRow: number, startCol: number, stopRow: number, stopCol: number,
    seqCopy: boolean,
    cb: StandardCallback) {
    if (this.select) {
      const history = new History('cells')
      for (let i = startRow; i <= stopRow; i++) {
        for (let j = startCol; j <= stopCol; j++) {
          const srcRowIndex = this.select.rowIndex(i - startRow)
          const srcColIndex = this.select.colIndex(j - startCol)
          const [oldDestCell, destCell] = this.copyCell(srcRowIndex, srcColIndex, i, j, seqCopy ? 'seqCopy' : 'copy', cb, () => {})
          history.add([i, j], oldDestCell, destCell)
        }
      }
      this.histories.push(history)
      this.change(this.data)
    }
  }
  private copyCell (srcRowIndex: number, srcColIndex: number, destRowIndex: number, destColIndex: number,
    state: 'seqCopy' | 'copy' | 'cut' | 'copyformat', cb: StandardCallback, clear: StandardCallback): [Cell | null, Cell | null] {
    const srcCell = this.getCell(srcRowIndex, srcColIndex)
    const rowDiff = destRowIndex - srcRowIndex
    const colDiff = destColIndex - srcColIndex
    if (srcCell) {
      let oldDestCell = this.getCell(destRowIndex, destColIndex)
      // let destCell = cellCopy(srcCell, destRowIndex - srcRowIndex, destColIndex - srcColIndex, state === 'seqCopy')
      const destCell = Object.assign({}, srcCell)
      if (srcCell.merge) {
        const [m1, m2] = srcCell.merge
        destCell.merge = [m1 + rowDiff, m2 + colDiff];
      }
      

      if (state === 'cut') {
        clear(srcRowIndex, srcColIndex, this.cell(srcRowIndex, srcColIndex, {}))
      }
      if (state === 'copyformat') {
        if (oldDestCell && oldDestCell.text) {
          destCell.text = oldDestCell.text
        }
      } else {
        const txt = destCell.text
        if (txt && !/^\s*$/.test(txt)) {
          if (/^\d*$/.test(txt) && state === 'seqCopy') {
            destCell.text = (parseInt(txt) + (destRowIndex - srcRowIndex) + (destColIndex - srcColIndex)) + ''
          } else if (txt.indexOf('=') !== -1) {
            // 如果text的内容是formula,那么需要需要修改表达式参数
            destCell.text = formulaReplaceParam(txt, rowDiff, colDiff)
          }
        }
      }

      cb(destRowIndex, destColIndex, this.cell(destRowIndex, destColIndex, destCell))
      return [oldDestCell, destCell];
    }
    return [null, null];
  }

  isRedo (): boolean {
    return this.histories2.length > 0
  }
  redo (cb: StandardCallback): boolean {
    const { histories, histories2 } = this
    if (histories2.length > 0) {
      const history = histories2.pop()
      if (history) {
        this.resetByHistory(history, cb, 'redo')
        histories.push(history)
        this.change(this.data)
      }
    }
    return this.isRedo()
  }

  isUndo (): boolean {
    return this.histories.length > 0
  }
  undo (cb: StandardCallback): boolean {
    const { histories, histories2 } = this
    // console.log('histories:', histories, histories2)
    if (histories.length > 0) {
      const history = histories.pop()
      if (history) {
        this.resetByHistory(history, cb, 'undo')
        histories2.push(history)
        this.change(this.data)
      }
    }
    return this.isUndo()
  }

  resetByHistory (v: History, cb: StandardCallback, state: 'undo' | 'redo') {
    // console.log('history: ', history)
    v.values.forEach(([keys, oldValue, value]) => {
      if (v.type === 'cells') {
        const v = state === 'undo' ? oldValue : value
        const oldCell = this.getCell(keys[0], keys[1])
        if (!oldCell) {
          if (keys.length === 3) {
            if (v) {
              const nValue: Cell = {}
              nValue[keys[2]] = v
              cb(keys[0], keys[1], this.cell(keys[0], keys[1], nValue))
            }
          } else {
            cb(keys[0], keys[1], this.cell(keys[0], keys[1], v || {}))
          }
        } else {
          if (keys.length === 3) {
            const nValue: Cell = {}
            nValue[keys[2]] = v
            if (v) {
              cb(keys[0], keys[1], this.cell(keys[0], keys[1], nValue, true))
            } else {
              cb(keys[0], keys[1], this.cell(keys[0], keys[1], mapIntFilter(oldCell, keys[2])))
            }
          } else {
            cb(keys[0], keys[1], this.cell(keys[0], keys[1], v || {}))
          }
        }
      } else {
        // cols, rows
        // const v = state === 'undo' ? oldValue : value
        // if (v !== null) {
        //   this.data[v.type]
        // }
      }
      // console.log('keys:', keys, ', oldValue:', oldValue, ', value:', value)
    })
  }

  clearformat (cb: StandardCallback) {
    const { select } = this
    if (select !== null) {
      const history = new History('cells')
      select.forEach((rindex, cindex, i, j, rowspan, colspan) => {
        let c = this.getCell(rindex, cindex);
        if (c) {
          history.add([rindex, cindex], c, {text: c.text})
          c = this.cell(rindex, cindex, {text: c.text});
          cb(rindex, cindex, c);
        }
      });
      this.histories.push(history)
      this.change(this.data)
    }
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
      const history = new History('cells')
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
            history.add([rindex, cindex, 'rowspan'], undefined, rowspan)
            history.add([rindex, cindex, 'colspan'], undefined, colspan)

            let cell = this.cell(rindex, cindex, v, true)
            ok(rindex, cindex, cell)
          } else {
            const oldCell = this.getCell(rindex, cindex)
            if (oldCell !== null) {
              history.add([rindex, cindex, 'rowspan'], oldCell.rowspan, undefined)
              history.add([rindex, cindex, 'colspan'], oldCell.colspan, undefined)

              let cell = this.cell(rindex, cindex, mapIntFilter(oldCell, 'rowspan', 'colspan', 'merge'))
              cancel(rindex, cindex, cell)
            }
          }
        } else {
          let v: Cell = {invisible: select.canMerge}
          if (select.canMerge) {
            history.add([rindex, cindex, 'invisible'], undefined, select.canMerge)

            v.merge = firstXY
            let cell = this.cell(rindex, cindex, v, true)
            other(rindex, cindex, cell)
          } else {
            const oldCell = this.getCell(rindex, cindex)
            if (oldCell !== null) {
              history.add([rindex, cindex, 'invisible'], oldCell.invisible, undefined)
              let cell = this.cell(rindex, cindex, mapIntFilter(oldCell, 'rowspan', 'colspan', 'merge', 'invisible'))
              other(rindex, cindex, cell)
            }
          }
        }
      })
      this.histories.push(history)
      select.canMerge = !select.canMerge
      this.change(this.data)
    }
  }
  cellAttr (key: keyof Cell, value: any, cb: StandardCallback): void {
    let v: Cell= {}
    v[key] = value
    const isDefault = value === this.data.cell[key]
    if (this.select !== null) {
      const history = new History('cells')
      this.select.forEach((rindex, cindex) => {
        const oldCell = this.getCell(rindex, cindex)
        
        history.add([rindex, cindex, key], oldCell !== null ? oldCell[key] : undefined, value)
        
        let cell = this.cell(rindex, cindex, isDefault ? mapIntFilter(oldCell, key) : v, !isDefault)
        cb(rindex, cindex, cell)
      
      })
      this.histories.push(history)
    }
    this.change(this.data)
  }
  cellText (value: any, cb: StandardCallback): Cell | null {
    if (this.currentCellIndexes) {
      // this.addHistoryValues()
      const history = new History('cells')
      const [rindex, cindex] = this.currentCellIndexes
      const oldCell = this.getCell(rindex, cindex)
      history.add([rindex, cindex, 'text'], oldCell !== null ? oldCell.text : undefined, value)
      const cell = this.cell(rindex, cindex, {text: value}, true)
      cb(rindex, cindex, cell)

      this.histories.push(history)
      this.change(this.data)
      return cell;
    }
    return null
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
      const history = new History('rows')
      data.rows = data.rows || {}
      data.rows[index] = data.rows[index] || {}
      data.rows[index].height = v
      history.add([index], null, data.rows[index])
      this.histories.push(history)
    }
    return (<any>Object).assign({height: data.rowHeight}, data.rows ? data.rows[index] : {})
  }
  // isData 是否返回数据的最大行数
  rows (isData: boolean): Array<Row> {
    const { data } = this;
    let maxRow;
    if (isData) {
      maxRow = 10
      if (this.data.cells) {
        maxRow = mapIntMaxKey(this.data.cells) + 2
      }
    } else {
      maxRow = mapIntMaxKeyWithDefault(100, data.rows)
    }
    return range(maxRow, (index) => this.row(index))
  }

  col (index: number, v?: number): Col {
    const { data } = this;
    if (v !== undefined) {
      const history = new History('cols')
      data.cols = data.cols || {}
      data.cols[index] = data.cols[index] || {}
      data.cols[index].width = v
      history.add([index], null, data.cols[index])
      this.histories.push(history)
    }
    const ret:any = {width: data.colWidth, title: alphabet(index)}
    if (data.cols && data.cols[index]) {
      for (let prop in data.cols[index]) {
        const col:any = data.cols[index]
        if (col[prop]) {
          ret[prop] = col[prop]
        }
      }
    }
    return ret
  }
  cols (): Array<Col> {
    const { data } = this;
    let maxCol = mapIntMaxKeyWithDefault(26 * 2, data.cols);
    return range(maxCol, (index) => this.col(index));
  }
}

const mapIntMaxKey = function<T>(mapInt: MapInt<T>): number {
  return Math.max(...Object.keys(mapInt).map(s => parseInt(s)))
}
// methods
const mapIntMaxKeyWithDefault = function<T>(max: number, mapInt: MapInt<T> | undefined): number {
  if (mapInt) {
    const m = mapIntMaxKey(mapInt)
    if (m > max) return m;
  }
  return max;
}
const mapIntFilter = function(obj: any, ...keys: Array<any>): any {
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