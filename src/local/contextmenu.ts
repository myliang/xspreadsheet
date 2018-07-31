import { Element, h } from "./base/element";
import { buildItem } from "./base/item";
import { buildMenu } from "./base/menu";
import { Table } from "./table"

export class ContextMenu {
  el: Element;
  constructor (public table: Table) {
    this.el = h().class('spreadsheet-contextmenu')
    .style('width', '160px')
    .on('click', (evt: any) => this.el.hide())
    .children([
      buildMenu().children([
        buildItem().on('click', (evt) => table.copy()).children(['copy', h().class('label').html('ctrl + c')]),
        buildItem().on('click', (evt) => table.cut()).children(['cut', h().class('label').html('ctrl + x')]),
        buildItem().on('click', (evt) => table.paste()).children(['paste', h().class('label').html('ctrl + v')]),
        // h().class('spreadsheet-item-separator'),
        // buildItem().on('click', (evt) => table.insert('row', 1)).html('insert row'),
        // buildItem().on('click', (evt) => table.insert('col', 1)).html('insert col')
      ])
    ]).onClickOutside(() => {}).hide()
    // clickoutside
  }

  set (evt: any) {
    const { offsetLeft, offsetTop } = evt.target
    const elRect = this.el.el.getBoundingClientRect()
    // cal left top
    const { clientWidth, clientHeight } = document.documentElement
    let top = offsetTop + evt.offsetY
    let left = offsetLeft + evt.offsetX

    if (evt.clientY > clientHeight / 1.5) {
      top -= elRect.height
    }
    if (evt.clientX > clientWidth / 1.5) {
      left -= elRect.width
    }
    this.el.style('left', `${left}px`).style('top', `${top}px`).show()
  }

}