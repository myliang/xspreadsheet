import { Element, h } from "./base/element";
import { bind, mouseMoveUp } from './event';
import { Spreadsheet } from "../core/index";
import { Table } from './table';

export class Selector {
  topEl: Element;
  rightEl: Element;
  bottomEl: Element;
  leftEl: Element;
  areaEl: Element;
  cornerEl: Element;
  copyEl: Element;
  el: Element;
  _offset = {left: 0, top: 0, width: 0, height: 0};

  startTarget: any;
  endTarget: any;

  change: () => void = () => {};
  changeCopy: (evt: any, arrow: 'bottom' | 'top' | 'left' | 'right', startRow: number, startCol: number, stopRow: number, stopCol: number) => void 
    = (evt, arrow, startRow, startCol, stopRow, stopCol) => {};

  constructor (public ss: Spreadsheet, public table: Table) {
    this.topEl = h().class('top-border');
    this.rightEl = h().class('right-border');
    this.bottomEl = h().class('bottom-border');
    this.leftEl = h().class('left-border');
    this.areaEl = h().class('area-border');
    this.cornerEl = h().class('corner').on('mousedown', (evt) => this.cornerMousedown(evt));
    this.copyEl = h().class('copy-border');
    this.el = h().class('spreadsheet-borders').children([
      this.topEl,
      this.rightEl,
      this.bottomEl,
      this.leftEl,
      this.areaEl,
      this.cornerEl,
      this.copyEl.hide(),
    ]).hide()
  }

  mousedown (evt: any) {
    // console.log('>>>>>>>>selector>>')
    // console.log(this, evt, evt.type, evt.detail, evt.buttons, evt.button)
    if (evt.detail === 1 && evt.target.getAttribute('type') === 'cell') {
      // console.log(evt.shiftKey)
      if (evt.shiftKey) {
        this.endTarget = evt.target
        this.setOffset()
        return
      }
      // Object.assign(this, {startTarget: evt.target, endTarget: evt.target})
      // this.setOffset()
      this.setCurrentTarget(evt.target)

      mouseMoveUp((e: any) => {
        if (e.buttons === 1 && e.target.getAttribute('type') === 'cell') {
          this.endTarget = e.target
          this.setOffset()
        }
      }, (e) => { this.change() })
      // show el
      this.el.show()
    }
  }

  setCurrentTarget (target: HTMLElement) {
    Object.assign(this, {startTarget: target, endTarget: target})
    this.setOffset()
  }

  private cornerMousedown (evt: any) {
    const { select } = this.ss
    if (select === null) {
      return ;
    }
    const [stopRow, stopCol] = select.stop;
    const [startRow, startCol] = select.start;
    
    let boxRange:['bottom' | 'top' | 'left' | 'right', number, number, number, number] | null = null;
    mouseMoveUp((e: any) => {
      const rowIndex = e.target.getAttribute('row-index')
      const colIndex = e.target.getAttribute('col-index')
      if (rowIndex && colIndex) {
        this.copyEl.show();
        let rdiff = stopRow - rowIndex
        let cdiff = stopCol - colIndex
        let _rdiff = startRow - rowIndex
        let _cdiff = startCol - colIndex
        const {left, top, height, width} = this._offset;
        // console.log(rdiff, cdiff, ',,,', _rdiff, _cdiff)
        if (rdiff < 0) {
          // bottom
          // console.log('FCK=>bottom', this.rowsHeight(stopRow, stopRow + Math.abs(rdiff)), rdiff)
          this.copyEl.styles({
            left: `${left - 1}px`,
            top: `${top - 1}px`,
            width: `${width - 1}px`,
            height: `${this.rowsHeight(stopRow - select.rowLen() + 1, stopRow + Math.abs(rdiff)) - 1}px`});
          boxRange = ['bottom', stopRow + 1, startCol, stopRow + Math.abs(rdiff), stopCol]
        } else if (cdiff < 0) {
          // right
          // console.log('FCK=>right')
          this.copyEl.styles({
            left: `${left - 1}px`,
            top: `${top - 1}px`,
            width: `${this.colsWidth(stopCol - select.colLen() + 1, stopCol + Math.abs(cdiff)) - 1}px`,
            height: `${height - 1}px`});
          boxRange = ['right', startRow, stopCol + 1, stopRow, stopCol + Math.abs(cdiff)]
        } else if (_rdiff > 0) {
          // top
          // console.log('FCK=>top')
          const h = this.rowsHeight(startRow - _rdiff, startRow - 1)
          this.copyEl.styles({
            left: `${left - 1}px`,
            top: `${top - h - 1}px`,
            width: `${width - 1}px`,
            height: `${h - 1}px`});
          boxRange = ['top', startRow - _rdiff, startCol, startRow - 1, stopCol]
        } else if (_cdiff > 0) {
          // left
          // console.log('FCK=>left')
          const w = this.colsWidth(startCol - _cdiff, startCol - 1)
          this.copyEl.styles({
            left: `${left - w - 1}px`,
            top: `${top - 1}px`,
            width: `${w - 1}px`,
            height: `${height - 1}px`});
          boxRange = ['left', startRow, startCol - _cdiff, stopRow, startCol - 1]
        } else {
          this.copyEl.styles({
            left: `${left - 1}px`,
            top: `${top - 1}px`,
            width: `${width - 1}px`,
            height: `${height - 1}px`});
          boxRange = null
        }
      }
    }, (e) => {
      this.copyEl.hide()
      if (boxRange !== null) {
        const [arrow, startRow, startCol, stopRow, stopCol] = boxRange
        this.changeCopy(e, arrow, startRow, startCol, stopRow, stopCol)
      }
    });
  }

  reload () {
    this.setOffset()
  }

  private setOffset () {
    if (this.startTarget === undefined) return ;
    let { select } = this.ss

    // console.log('select: ', select, this.table)
    if (select) {
      // console.log('clear>>>>>:::')
      // clear
      const [minRow, minCol] = select.start
      const [maxRow, maxCol] = select.stop
      _forEach(minRow, maxRow, this.table.firsttds, (e) => { e.deactive() })
      _forEach(minCol, maxCol, this.table.ths, (e) => { e.deactive() })
    }

    select = this.ss.buildSelect(this.startTarget, this.endTarget)
    const [minRow, minCol] = select.start
    const [maxRow, maxCol] = select.stop
    // let height = 0, width = 0;
    const height = this.rowsHeight(minRow, maxRow, (e) => e.active())
    // _forEach(minRow, maxRow, this.table.firsttds, (e) => { 
    //   e.active()
    //   height += parseInt(e.offset().height)
    // })
    // height /= 2
    const width = this.colsWidth(minCol, maxCol, (e) => e.active())
    // _forEach(minCol, maxCol, this.table.ths, (e) => {
    //   e.active()
    //   width += parseInt(e.offset().width)
    // })

    // console.log('>>', minRow, minCol, maxRow, maxCol, height, width)
    const td = this.table.td(minRow, minCol)
    if (td) {
      // console.log('td:', td)
      const {left, top} = td.offset()
      this._offset = {left, top, width, height};

      this.topEl.styles({left: `${left - 1}px`, top: `${top - 1}px`, width: `${width + 1}px`, height: '2px'})
      this.rightEl.styles({left: `${left + width - 1}px`, top: `${top - 1}px`, width: '2px', height: `${height}px`})
      this.bottomEl.styles({left: `${left - 1}px`, top: `${top + height - 1}px`, width: `${width}px`, height: '2px'})
      this.leftEl.styles({left: `${left - 1}px`, top: `${top - 1}px`, width: '2px', height: `${height}px`})
      this.areaEl.styles({left: `${left}px`, top: `${top}px`, width: `${width - 2}px`, height: `${height - 2}px`})
      this.cornerEl.styles({left: `${left + width - 5}px`, top: `${top + height - 5}px`})
    }
  }
  private rowsHeight (minRow:number, maxRow:number, cb: (e: Element) => void = (e) => {}): number {
    let height = 0
    _forEach(minRow, maxRow, this.table.firsttds, (e) => { 
      cb(e)
      height += parseInt(e.offset().height)
    })
    height /= 2
    return height
  }
  private colsWidth (minCol: number, maxCol: number, cb: (e: Element) => void = (e) => {}): number {
    let width = 0
    _forEach(minCol, maxCol, this.table.ths, (e) => {
      cb(e)
      width += parseInt(e.offset().width)
    })
    return width
  }
}

const _forEach = (start: number, stop: number, elements: {[key: string]: Array<Element> | Element}, cb: (e: Element) => void): void => {
  for (let i = start; i <= stop; i++) {
    const es = elements[i + ''];
    if (es) {
      if (es instanceof Element) {
        cb(es)
      } else {
        es.forEach(e => cb(e))
      }
    }
  }
}

export class DashedSelector {
  el: Element;
  constructor () {
    this.el = h().class('spreadsheet-borders dashed').hide();
  }

  set (selector: Selector) {
    if (selector._offset) {
      const { left, top, width, height } = selector._offset;
      this.el
        .style('left', `${left - 2}px`)
        .style('top', `${top - 2}px`)
        .style('width', `${width}px`)
        .style('height', `${height}px`)
        .show();
    }
  }

  hide () {
    this.el.hide();
  }
}
