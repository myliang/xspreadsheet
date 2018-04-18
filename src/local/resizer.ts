import { Element, h } from "./base/element";
import { mouseMoveUp } from './event';

export class Resizer {
  el: Element;
  resizer: Element;
  resizerLine: Element;
  moving: boolean = false;
  index: number = 0;
  constructor (public vertical: boolean, public change: (index: number, distance: number) => void) {
    this.el = h().children([
      this.resizer = h().class(`spreadsheet-resizer ${vertical ? 'vertical' : 'horizontal'}`)
        .on('mousedown', (evt: Event) => this.mousedown(evt)),
      this.resizerLine = h().class(`spreadsheet-resizer-line ${vertical ? 'vertical' : 'horizontal'}`).hide()
    ])
  }

  set (target: any, index: number) {
    if (this.moving) return ;
    this.index = index
    const { vertical } = this
    const { offsetLeft, offsetTop, offsetHeight, offsetWidth, parentNode } = target
    // console.log(parentNode.parentNode.parentNode.parentNode.nextSibling.offsetHeight)
    this.resizer.styles({
      left: `${vertical ? offsetLeft + offsetWidth - 5 : offsetLeft}px`,
      top: `${vertical ? offsetTop : offsetTop + offsetHeight - 5}px`,
      width: `${vertical ? 5 : offsetWidth}px`,
      height: `${vertical ? offsetHeight : 5}px`
    })
    this.resizerLine.styles({
      left: `${vertical ? offsetLeft + offsetWidth : offsetLeft}px`,
      top: `${vertical ? offsetTop : offsetTop + offsetHeight}px`,
      width: `${vertical ? 0 : parentNode.offsetWidth}px`,
      height: `${vertical ? parentNode.parentNode.parentNode.parentNode.nextSibling.offsetHeight + parentNode.offsetHeight : 0}px`
    })
    // this.el.show()
  }

  mousedown (evt: any) {
    let startEvt = evt;
    let distance = 0;
    this.resizerLine.show()
    mouseMoveUp((e: any) => {
      this.moving = true
      if (startEvt !== null && e.buttons === 1) {
        if (this.vertical) {
          const d = e.x - startEvt.x
          distance += d
          this.resizer.style('left', `${this.resizer.offset().left + d}px`)
          this.resizerLine.style('left', `${this.resizerLine.offset().left + d}px`)
        } else {
          const d = e.y - startEvt.y
          distance += d
          this.resizer.style('top', `${this.resizer.offset().top + d}px`)
          this.resizerLine.style('top', `${this.resizerLine.offset().top + d}px`)
        }
        startEvt = e
      }
    }, (e: any) => {
      this.change(this.index, distance)
      startEvt = null
      this.resizerLine.hide()
      distance = 0
      this.moving = false
    })
  }
}