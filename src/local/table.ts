import { Element, h } from "./base/element";
import { Spreadsheet } from '../core/index'
import { Editor } from './editor';
import { Selector } from './selector';
import { Resizer } from './resizer';
import { Editorbar } from "./editorbar";
import { Toolbar } from "./toolbar";
import { Cell } from "../core/cell";

interface Map<T> {
  [key: string]: T
}

export class Table {
  cols: Map<Array<Element>> = {};
  firsttds: Map<Array<Element>> = {};
  tds: Map<Element> = {};
  ths: Map<Element> = {};
  ss: Spreadsheet;

  el: Element;
  header: Element;
  fixedLeftBody: Element | null = null;

  editor: Editor;
  rowResizer: Resizer;
  colResizer: Resizer;

  selector: Selector;

  currentIndexs = [0, 0];

  bodyHeight: () => number;

  // change
  editorChange: (v: Cell) => void = (v) => {}
  clickCell: (rindex: number, cindex: number, v: Cell) => void = (rindex, cindex, v) => {}

  constructor (ss: Spreadsheet, bodyHeightFn?: () => number) {
    this.ss = ss;
    this.editor = new Editor()
    this.rowResizer = new Resizer(false, (index, distance) => this.changeRowResizer(index, distance))
    this.colResizer = new Resizer(true, (index, distance) => this.changeColResizer(index, distance))
    this.selector = new Selector(this.ss, this);
    if (bodyHeightFn) {
      this.bodyHeight = bodyHeightFn
    } else {
      this.bodyHeight = (): number => {
        return document.documentElement.clientHeight - 24 - 41 - 26
      }
    }
    this.el = h().class('spreadsheet-table').children([
      this.colResizer.el,
      this.rowResizer.el,
      this.buildFixedLeft(),
      this.header = this.buildHeader(),
      this.buildBody()
    ]);
  }

  setValueWithText (v: Cell) {
    this.td(this.currentIndexs[0], this.currentIndexs[1]).html(v.text)
    this.editor.setValue(v)
  }

  private changeRowResizer (index: number, distance: number) {
    const h = this.ss.row(index).height + distance
    if (h <= this.ss.defaultRowHeight()) return
    this.ss.row(index, h)
    const firstTds = this.firsttds[index+'']
    if (firstTds) {
      firstTds.forEach(td => td.attr('height', h))
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

  private buildColGroup (lastColWidth: number): Element {
    const cols = this.ss.cols();
    return h('colgroup').children([
      h('col').attr('width', '60'),
      ...cols.map((col, index) => {
        let c = h('col').attr('width', col.width)
        this.cols[index+''] = this.cols[index+''] || []
        this.cols[index+''].push(c)
        return c; 
      }),
      h('col').attr('width', lastColWidth)
    ])
  }

  private buildFixedLeft (): Element {
    const rows = this.ss.rows();
    return h().class('spreadsheet-fixed')
    .style('width', '60px')
    .children([
      h().class('spreadsheet-header').child(h('table').child(
        h('thead').child(
          h('tr').child(
            h('th').child('-')
          )
        ),
      )),
      this.fixedLeftBody = 
      h().class('spreadsheet-body')
      .style('height', `${this.bodyHeight() - 15}px`)
      .children([
        h('table').child(
          h('tbody').children(
            rows.map((row, rindex) => {
              let firstTd = h('td').attr('height', `${row.height}`).child(`${rindex + 1}`)
                .on('mouseover', (evt: Event) => this.rowResizer.set(evt.target, rindex));
              this.firsttdsPush(rindex, firstTd)
              return h('tr').child(firstTd)
            })
          )
        )
      ])
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
        }),
        h('th')
      ]
    ))
    return h().class('spreadsheet-header').children([
      h('table').children([this.buildColGroup(15), thead])
    ])
  }

  private buildBody () {
    const rows = this.ss.rows();
    const cols = this.ss.cols();
    
    this.editor.onChange((v) => {
      this.td(this.currentIndexs[0], this.currentIndexs[1]).html(v.text)
      this.editorChange(v)
      // this.editorbar.setValue(v)
    })

    const mousedown = (rindex: number, cindex: number) => {
      this.currentIndexs = [rindex, cindex]
      const cCell = this.ss.currentCell([rindex, cindex])
      this.editor.clear()
      this.clickCell(rindex, cindex, cCell)
    }

    const dblclick = (rindex: number, cindex: number) => {
      const td = this.td(rindex, cindex)
      this.editor.set(td.el, this.ss.currentCell())
    }

    const scrollFn = (evt: any) => {
      this.header.el.scrollLeft = evt.target.scrollLeft
      this.fixedLeftBody && (this.fixedLeftBody.el.scrollTop = evt.target.scrollTop)
      // console.log('>>>>>>>>scroll...', this.header, evt.target.scrollLeft, evt.target.scrollHeight)
    }

    const tbody = h('tbody').children(rows.map((row, rindex) => {
      let firstTd = h('td').attr('height', `${row.height}`).child(`${rindex + 1}`);
      this.firsttdsPush(rindex, firstTd)
      return h('tr').children([
        firstTd,
        ...cols.map((col, cindex) => {
          let td = h('td')
            .child(this.ss.cell(rindex, cindex).text || '')
            .attr('type', 'cell')
            .attr('row-index', rindex + '')
            .attr('col-index', cindex + '')
            .on('mousedown', mousedown.bind(null, rindex, cindex))
            .on('dblclick', dblclick.bind(null, rindex, cindex));
          this.tds[`${rindex}_${cindex}`] = td
          return td;
        }),
        h('td')
      ])
    }));

    return h().class('spreadsheet-body')
      .on('scroll', scrollFn)
      .style('height', `${this.bodyHeight()}px`)
      .children([
        h('table').children([this.buildColGroup(0), tbody]),
        this.editor.el,
        this.selector.el
      ]
    )
  }

  private firsttdsPush (index: number, el: Element) {
    this.firsttds[`${index}`] = this.firsttds[`${index}`] || []  
    this.firsttds[`${index}`].push(el)
  }

  td (rindex: number, cindex: number): Element {
    const td = this.tds[`${rindex}_${cindex}`]
    return td
  }

}