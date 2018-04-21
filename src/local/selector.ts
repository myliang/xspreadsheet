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
  el: Element;

  startTarget: any;
  endTarget: any;

  constructor (public ss: Spreadsheet, public table: Table) {
    this.topEl = h().class('top-border');
    this.rightEl = h().class('right-border');
    this.bottomEl = h().class('bottom-border');
    this.leftEl = h().class('left-border');
    this.areaEl = h().class('area-border');
    this.cornerEl = h().class('corner');
    this.el = h().class('spreadsheet-borders').children([
      this.topEl,
      this.rightEl,
      this.bottomEl,
      this.leftEl,
      this.areaEl,
      this.cornerEl
    ])
    bind('mousedown', (evt: Event) => { this.mousedown(evt) })
  }

  private mousedown (evt: any) {
    // console.log(this, evt, evt.type, evt.detail, evt.buttons)
    if (evt.detail === 1 && evt.target.getAttribute('type') === 'cell') {
      // console.log(evt.shiftKey)
      if (evt.shiftKey) {
        this.endTarget = evt.target
        this.setOffset()
        return
      }
      Object.assign(this, {startTarget: evt.target, endTarget: evt.target})
      this.setOffset()

      mouseMoveUp((e: any) => {
        if (e.buttons === 1 && e.target.getAttribute('type') === 'cell') {
          this.endTarget = e.target
          this.setOffset()
        }
      }, (e) => {  })
    }
  }

  reload () {
    this.setOffset()
  }

  private setOffset () {
    if (this.startTarget === undefined) return ;
    let { select } = this.ss

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
    let height = 0, width = 0;
    _forEach(minRow, maxRow, this.table.firsttds, (e) => { 
      e.active()
      height += parseInt(e.offset().height)
    })
    height /= 2
    
    _forEach(minCol, maxCol, this.table.ths, (e) => {
      e.active()
      width += parseInt(e.offset().width)
    })

    // console.log('>>', minRow, minCol, maxRow, maxCol, height, width)
    const td = this.table.td(minRow, minCol)
    if (td) {
      // console.log('td:', td)
      const {left, top} = td.offset()
      this.topEl.styles({left: `${left - 1}px`, top: `${top - 1}px`, width: `${width + 1}px`, height: '2px'})
      this.rightEl.styles({left: `${left + width - 1}px`, top: `${top - 1}px`, width: '2px', height: `${height}px`})
      this.bottomEl.styles({left: `${left - 1}px`, top: `${top + height - 1}px`, width: `${width}px`, height: '2px'})
      this.leftEl.styles({left: `${left - 1}px`, top: `${top - 1}px`, width: '2px', height: `${height}px`})
      this.areaEl.styles({left: `${left}px`, top: `${top}px`, width: `${width - 2}px`, height: `${height - 2}px`})
      this.cornerEl.styles({left: `${left + width - 5}px`, top: `${top + height - 5}px`})
    }
  }
}
