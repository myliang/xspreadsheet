import { Element, h } from "./base/element";
import { Spreadsheet, SpreadsheetData } from '../core/index'
import { Editor } from './editor';
import { Selector, DashedSelector } from './selector';
import { Resizer } from './resizer';
import { Editorbar } from "./editorbar";
import { Toolbar } from "./toolbar";
import { Cell, getStyleFromCell } from "../core/cell";
import { formatRenderHtml } from "../core/format";
import { formulaRender } from "../core/formula";
import { bind } from "./event";

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
  dashedSelector: DashedSelector;
  state: 'copy' | 'cut' | 'copyformat' | null = null;

  currentIndexs: [number, number] | null = null;

  bodyHeight: () => number;

  // change
  change: (data: SpreadsheetData) => void = () => {}
  editorChange: (v: Cell) => void = (v) => {}
  clickCell: (rindex: number, cindex: number, v: Cell | null) => void = (rindex, cindex, v) => {}

  constructor (ss: Spreadsheet, bodyHeightFn?: () => number) {
    this.ss = ss;
    this.ss.change = (data) => {
      this.change(data)
    }

    this.editor = new Editor(ss.defaultRowHeight())
    this.rowResizer = new Resizer(false, (index, distance) => this.changeRowResizer(index, distance))
    this.colResizer = new Resizer(true, (index, distance) => this.changeColResizer(index, distance))
    this.selector = new Selector(this.ss, this);
    this.selector.change = () => this.selectorChange();
    this.selector.changeCopy = (e, arrow, startRow, startCol, stopRow, stopCol) => {
      this.selectorChangeCopy(e, arrow, startRow, startCol, stopRow, stopCol);
    }
    this.dashedSelector = new DashedSelector();

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

    // bind ctrl + c, ctrl + x, ctrl + v
    bind('keydown', (evt: any) => {
      // ctrlKey
      if (evt.ctrlKey) {
        // ctrl + c
        if (evt.keyCode === 67) {
          this.copy();
          evt.returnValue = false
        }
        // ctrl + x
        if (evt.keyCode === 88) {
          this.cut();
          evt.returnValue = false
        }
        // ctrl + v
        if (evt.keyCode === 86) {
          this.paste();
          evt.returnValue = false
        }
      }
    });
  }

  setValueWithText (v: Cell) {
    // console.log('setValueWithText: v = ', v)
    if (this.currentIndexs) {
      this.ss.cellText(v.text, (rindex, cindex, cell) => {
        this.td(rindex, cindex).html(this.renderCell(cell))
      })
    }
    this.editor.setValue(v)
  }

  setTdWithCell (rindex: number, cindex: number, cell: Cell, autoWordWrap = true) {
    this.setTdStyles(rindex, cindex, cell);
    this.setRowHeight(rindex, cindex, autoWordWrap);
    this.td(rindex, cindex).html(this.renderCell(cell));
  }

  setCellAttr (k: keyof Cell, v: any) {
    this.ss.cellAttr(k, v, (rindex, cindex, cell) => {
      this.setTdWithCell(rindex, cindex, cell, k === 'wordWrap' && v);
    })
    this.editor.setStyle(this.ss.currentCell())
  }

  undo (): boolean {
    return this.ss.undo((rindex, cindex, cell) => {
      // console.log('>', rindex, ',', cindex, '::', cell)
      this.setTdStylesAndAttrsAndText(rindex, cindex, cell)
    })
  }
  redo (): boolean {
    return this.ss.redo((rindex, cindex, cell) => {
      this.setTdStylesAndAttrsAndText(rindex, cindex, cell)
    })
  }
  private setTdStylesAndAttrsAndText (rindex: number, cindex: number, cell: Cell) {
    let td = this.td(rindex, cindex);
    this.setTdStyles(rindex, cindex, cell);
    this.setTdAttrs(rindex, cindex, cell);
    td.html(this.renderCell(cell));
  }

  copy () {
    this.ss.copy();
    this.dashedSelector.set(this.selector);
    this.state = 'copy';
  }

  cut () {
    this.ss.cut();
    this.dashedSelector.set(this.selector);
    this.state = 'cut';
  }

  copyformat () {
    this.ss.copy();
    this.dashedSelector.set(this.selector);
    this.state = 'copyformat';
  }

  paste () {
    // console.log('state: ', this.state, this.ss.select)
    if (this.state !== null && this.ss.select) {
      this.ss.paste((rindex, cindex, cell) => {
        // console.log('rindex: ', rindex, ', cindex: ', cindex);
        let td = this.td(rindex, cindex);
        this.setTdStyles(rindex, cindex, cell);
        this.setTdAttrs(rindex, cindex, cell);
        if (this.state === 'cut' || this.state === 'copy') {
          td.html(this.renderCell(cell));
        }
      }, this.state, (rindex, cindex, cell) => {
        let td = this.td(rindex, cindex);
        this.setTdStyles(rindex, cindex, cell);
        this.setTdAttrs(rindex, cindex, cell);
        td.html('');
      });
      this.selector.reload();
    }

    if (this.state === 'copyformat') {
      this.state = null;
    } else if (this.state === 'cut') {
      this.state = null;  
    } else if (this.state === 'copy') {
      // this.ss.paste()
    }
    
    this.dashedSelector.hide();
  }

  clearformat () {
    this.ss.clearformat((rindex, cindex, cell) => {
      this.td(rindex, cindex)
        .removeAttr('rowspan')
        .removeAttr('colspan')
        .styles({}, true)
        .show(true);
    })
  }

  merge () {
    this.ss.merge((rindex, cindex, cell) => {
      // console.log(rindex, cindex, '>>>', this.table.td(rindex, cindex))
      this.setTdAttrs(rindex, cindex, cell).show(true)
    }, (rindex, cindex, cell) => {
      this.setTdAttrs(rindex, cindex, cell).show(true)
    }, (rindex, cindex, cell) => {
      let td = this.td(rindex, cindex)
      !cell.invisible ? td.show(true) : td.hide()
    })
  }

  td (rindex: number, cindex: number): Element {
    const td = this.tds[`${rindex}_${cindex}`]
    return td
  }

  private selectorChange () {
    if (this.state === 'copyformat') {
      this.paste();
    }
  }

  private selectorChangeCopy (evt: any, arrow: 'bottom' | 'top' | 'left' | 'right', startRow: number, startCol: number, stopRow: number, stopCol: number) {
    this.ss.batchPaste(arrow, startRow, startCol, stopRow, stopCol, evt.ctrlKey, (rindex, cindex, cell) => {
      this.setTdStyles(rindex, cindex, cell);
      this.setTdAttrs(rindex, cindex, cell);
      this.td(rindex, cindex).html(this.renderCell(cell));
    })
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

  private setTdStyles (rindex: number, cindex: number, cell: Cell): Element {
    return this.td(rindex, cindex).styles(getStyleFromCell(cell), true)
  }
  private setTdAttrs (rindex: number, cindex: number, cell: Cell): Element {
    return this.td(rindex, cindex)
      .attr('rowspan', cell.rowspan || 1)
      .attr('colspan', cell.colspan || 1);
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
      h().class('spreadsheet-fixed-header').child(h('table').child(
        h('thead').child(
          h('tr').child(
            h('th').child('-')
          )
        ),
      )),
      this.fixedLeftBody = 
      h().class('spreadsheet-fixed-body')
      .style('height', `${this.bodyHeight() - 18}px`)
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

    const mousedown = (rindex: number, cindex: number, evt: any) => {
      this.selector.mousedown(evt)
      const editorValue = this.editor.value
      if (this.currentIndexs && this.editor.target && editorValue) {
        // console.log(':::editorValue:', editorValue)
        const oldCell = this.ss.cellText(editorValue.text, (_rindex, _cindex, _cell: Cell) => {
          this.td(_rindex, _cindex).html(this.renderCell(_cell))
        });
        // const oldTd = this.td(this.currentIndexs[0], this.currentIndexs[1]);
        // oldTd.html(this.renderCell(editorValue))
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
        this.selector.el,
        this.dashedSelector.el
      ]
    )
  }

  private firsttdsPush (index: number, el: Element) {
    this.firsttds[`${index}`] = this.firsttds[`${index}`] || []  
    this.firsttds[`${index}`].push(el)
  }

}