import { Element, h } from "./base/element";
import { Spreadsheet } from '../core/index'
import { Editor } from './editor';
import { Selector } from './selector';
import { Resizer } from './resizer';

interface Map<T> {
  [key: string]: T
}

export class Table {
  cols: Map<Array<Element>> = {};
  firsttds: Map<Element> = {};
  tds: Map<Element> = {};
  ths: Map<Element> = {};
  ss: Spreadsheet;
  el: Element;
  editor: Editor;

  rowResizer: Resizer;
  colResizer: Resizer;

  selector: Selector;

  constructor (ss: Spreadsheet) {
    this.ss = ss;
    this.editor = new Editor()
    this.rowResizer = new Resizer(false, (index, distance) => this.changeRowResizer(index, distance))
    this.colResizer = new Resizer(true, (index, distance) => this.changeColResizer(index, distance))
    this.selector = new Selector(this.ss, this);
    this.el = h().class('spreadsheet-table').children([
      this.colResizer.el,
      this.buildHeader(),
      this.buildBody()
    ]);
  }

  private changeRowResizer (index: number, distance: number) {
    const h = this.ss.row(index).height + distance
    if (h <= this.ss.defaultRowHeight()) return
    this.ss.row(index, h)
    const firstTd = this.firsttds[index+'']
    if (firstTd) {
      firstTd.attr('height', h)
    }
    this.selector.reload()
    this.editor.reload()
  }
  private changeColResizer (index: number, distance: number) {
    const w = this.ss.col(index).width + distance
    if (w <= this.ss.defaultColWidth()) return
    this.ss.col(index, w)
    const cols = this.cols[index+'']
    if (cols) {
      cols.forEach(col => col.attr('width', w))
    }
    this.selector.reload()
    this.editor.reload()
  }

  private buildColGroup (): Element {
    const cols = this.ss.cols();
    return h('colgroup').children([
      h('col').attr('width', '60'),
      ...cols.map((col, index) => {
        let c = h('col').attr('width', col.width)
        this.cols[index+''] = this.cols[index+''] || []
        this.cols[index+''].push(c)
        return c; 
      })
    ])
  }

  private buildHeader (): Element {
    const cols = this.ss.cols();
    const thead = h('thead').child(
      h('tr').children([
        h('th'),
        ...cols.map((col, index) => {
          let th = h('th').child(col.title).on('mouseover', (evt: Event) => this.colResizer.set(evt.target, index));
          this.ths[index + ''] = th;
          return th;
        })
      ]
    ))
    return h().class('spreadsheet-header').children([
      h('table').children([this.buildColGroup(), thead])
    ])
  }

  private buildBody () {
    const rows = this.ss.rows();
    const cols = this.ss.cols();

    const mousedown = (rindex: number, cindex: number) => {
      this.ss.currentCell([rindex, cindex])
      this.editor.clear()
    }

    const dblclick = (rindex: number, cindex: number) => {
      const td = this.td(rindex, cindex)
      if (td) {
        // console.log('td: ', td, this.ss)
        this.editor.set(td.el, this.ss.currentCell())
      }
    }

    const tbody = h('tbody').children(rows.map((row, rindex) => {
      let firstTd = h('td').attr('width', `${row.height}`).child(`${rindex + 1}`)
        .on('mouseover', (evt: Event) => this.rowResizer.set(evt.target, rindex))
      this.firsttds[`${rindex}`] = firstTd
      return h('tr').children([
        firstTd,
        ...cols.map((col, cindex) => {
          let td = h('td')
            .attr('type', 'cell')
            .attr('row-index', rindex + '')
            .attr('col-index', cindex + '')
            .on('mousedown', mousedown.bind(null, rindex, cindex))
            .on('dblclick', dblclick.bind(null, rindex, cindex));
          this.tds[`${rindex}_${cindex}`] = td
          return td;
        })
      ])
    }));

    return h().class('spreadsheet-body').children([
      h('table').children([this.buildColGroup(), tbody]),
      this.editor.el,
      this.selector.el,
      this.rowResizer.el
    ])
  }

  td (rindex: number, cindex: number): Element | undefined {
    return this.tds[`${rindex}_${cindex}`]
  }

}