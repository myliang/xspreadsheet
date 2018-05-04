import { Element, h } from "./base/element";
import { Spreadsheet } from '../core/index'
import { Editor } from './editor';
import { Selector } from './selector';
import { Resizer } from './resizer';
import { Editorbar } from "./editorbar";
import { Toolbar } from "./toolbar";
import { Cell, getStyleFromCell } from "../core/cell";
import { formatRenderHtml } from "../core/format";
import { formulaRender } from "../core/formula";

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

  currentIndexs: [number, number] | null = null;

  bodyHeight: () => number;

  // change
  editorChange: (v: Cell) => void = (v) => {}
  clickCell: (rindex: number, cindex: number, v: Cell | null) => void = (rindex, cindex, v) => {}

  constructor (ss: Spreadsheet, bodyHeightFn?: () => number) {
    this.ss = ss;
    this.editor = new Editor(ss.defaultRowHeight())
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
    this.currentIndexs && this.td(this.currentIndexs[0], this.currentIndexs[1]).html(this.renderCell(v))
    this.editor.setValue(v)
  }

  setTdWithCell (rindex: number, cindex: number, cell: Cell, autoWordWrap = true) {
    this.setTdStyles(rindex, cindex, cell);
    this.setRowHeight(rindex, cindex, autoWordWrap);
    this.td(rindex, cindex).html(this.renderCell(cell));
  }

  td (rindex: number, cindex: number): Element {
    const td = this.tds[`${rindex}_${cindex}`]
    return td
  }

  private renderCell (cell: Cell | null): string {
    if (cell) {
      return formatRenderHtml(cell.format, this._renderCell(cell))
    }
    return '';
  }
  private _renderCell (cell: Cell | null): string {
    if (cell) {
      let text = cell.text || '';
      return formulaRender(text, (rindex, cindex) => this._renderCell(this.ss.getCell(rindex, cindex)))
    }
    return '';
  }

  private setRowHeight (rindex: number, cindex: number, autoWordWrap: boolean) {
    // console.log('rowHeight: ', this.td(rindex, cindex).offset().height, ', autoWordWrap:', autoWordWrap)
    // 遍历rindex行的所有单元格，计算最大高度
    const cols = this.ss.cols()
    const td = this.td(rindex, cindex)
    let h = td.offset().height
    // console.log()
    const tdRowspan = td.attr('rowspan')
    if (tdRowspan) {
      for (let i = 1; i < parseInt(tdRowspan); i++) {
        let firsttds = this.firsttds[i+'']
        firsttds && (h -= parseInt(firsttds[0].attr('height') || 0) + 1)
      }
    }
    this.changeRowHeight(rindex, h - 1);
  }

  private setTdStyles (rindex: number, cindex: number, cell: Cell) {
    this.td(rindex, cindex).styles(getStyleFromCell(cell), true)
  }

  private changeRowHeight (index: number, h: number) {
    if (h <= this.ss.defaultRowHeight()) return
    this.ss.row(index, h)
    const firstTds = this.firsttds[index+'']
    if (firstTds) {
      firstTds.forEach(td => td.attr('height', h))
    }
    this.selector.reload()
    this.editor.reload()
  }
  private changeRowResizer (index: number, distance: number) {
    const h = this.ss.row(index).height + distance
    this.changeRowHeight(index, h);
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
    
    // this.editor.onChange((v) => {
    //   this.td(this.currentIndexs[0], this.currentIndexs[1]).html(v.text)
    //   this.editorChange(v)
    //   // this.editorbar.setValue(v)
    // })

    const mousedown = (rindex: number, cindex: number, evt: any) => {
      this.selector.mousedown(evt)
      const editorValue = this.editor.value
      if (this.currentIndexs && this.editor.target && editorValue) {
        const oldCell = this.ss.cell(this.currentIndexs[0], this.currentIndexs[1], editorValue, true);
        const oldTd = this.td(this.currentIndexs[0], this.currentIndexs[1]);
        oldTd.html(this.renderCell(editorValue))
        if (oldCell) {
          // 设置内容之后，获取高度设置行高
          if (oldCell.wordWrap) {
            this.setRowHeight(this.currentIndexs[0], this.currentIndexs[1], true)
          }
          // console.log('old.td.offset:', oldTd.offset().height)
          this.editorChange(oldCell)
        }
      }
      this.editor.clear()

      this.currentIndexs = [rindex, cindex]
      const cCell = this.ss.currentCell([rindex, cindex])
      this.clickCell(rindex, cindex, cCell)
      // console.log('>>>>>>>>><<<<')
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
          let cell = this.ss.getCell(rindex, cindex)
          let td = h('td')
            .child(this.renderCell(cell))
            .attr('type', 'cell')
            .attr('row-index', rindex + '')
            .attr('col-index', cindex + '')
            .attr('rowspan', cell && cell.rowspan || 1)
            .attr('colspan', cell && cell.colspan || 1)
            .styles(getStyleFromCell(cell), true)
            .on('mousedown', (evt: any) => mousedown(rindex, cindex, evt))
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

}