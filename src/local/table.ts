import { Element, h } from "./base/element";
import { Spreadsheet, SpreadsheetData } from '../core/index'
import { Editor } from './editor';
import { Selector, DashedSelector } from './selector';
import { Resizer } from './resizer';
import { Editorbar } from "./editorbar";
import { Toolbar } from "./toolbar";
import { ContextMenu } from "./contextmenu";
import { Cell, getStyleFromCell } from "../core/cell";
import { formatRenderHtml } from "../core/format";
import { formulaRender } from "../core/formula";
import { bind } from "./event";

interface Map<T> {
  [key: string]: T
}

export interface TableOption {
  height: () => number,
  width: () => number,
  mode: 'design' | 'write' | 'read';
}

export class Table {
  cols: Map<Array<Element>> = {};
  firsttds: Map<Array<Element>> = {};
  tds: Map<Element> = {};
  ths: Map<Element> = {};
  ss: Spreadsheet;
  formulaCellIndexs: Set<string> = new Set(); // 表达式单元格set

  el: Element;
  header: Element;
  body: Element;
  fixedLeftBody: Element | null = null;

  editor: Editor | null = null;
  rowResizer: Resizer | null = null;
  colResizer: Resizer | null = null;

  contextmenu: ContextMenu | null = null;

  selector: Selector;
  dashedSelector: DashedSelector;
  state: 'copy' | 'cut' | 'copyformat' | null = null;

  currentIndexs: [number, number] | null = null;

  // 当前用户是否焦点再table上
  focusing: boolean = false;

  // change
  change: (data: SpreadsheetData) => void = () => {}
  editorChange: (v: Cell) => void = (v) => {}
  clickCell: (rindex: number, cindex: number, v: Cell | null) => void = (rindex, cindex, v) => {}

  constructor (ss: Spreadsheet, public options: TableOption) {
    this.ss = ss;
    this.ss.change = (data) => {
      this.change(data)
    }

    if (options.mode !== 'read') {
      this.editor = new Editor(ss.defaultRowHeight(), ss.formulas)
      this.editor.change = (v: Cell) => this.editorChange(v)
    }

    if (options.mode === 'design') {
      this.rowResizer = new Resizer(false, (index, distance) => this.changeRowResizer(index, distance))
      this.colResizer = new Resizer(true, (index, distance) => this.changeColResizer(index, distance))
      this.contextmenu = new ContextMenu(this)
    }

    this.selector = new Selector(this.ss, this);
    this.selector.change = () => this.selectorChange();
    this.selector.changeCopy = (e, arrow, startRow, startCol, stopRow, stopCol) => {
      this.selectorChangeCopy(e, arrow, startRow, startCol, stopRow, stopCol);
    }
    this.dashedSelector = new DashedSelector();

    this.el = h().class('spreadsheet-table').children([
      this.colResizer && this.colResizer.el || '',
      this.rowResizer && this.rowResizer.el || '',
      this.buildFixedLeft(),
      this.header = this.buildHeader(),
      this.body = this.buildBody()
    ]).on('contextmenu', (evt) => {
      evt.returnValue = false
      evt.preventDefault();
    });

    bind('resize', (evt: any) => {
      this.header.style('width', `${this.options.width()}px`)
      this.body.style('width', `${this.options.width()}px`)
      if (this.options.mode !== 'read') {
        this.body.style('height', `${this.options.height()}px`)
      }
    })

    bind('click', (evt: any) => {
      // console.log('::::::::', this.el.contains(evt.target))
      this.focusing = this.el.parent().contains(evt.target)
    })

    // bind ctrl + c, ctrl + x, ctrl + v
    bind('keydown', (evt: any) => {

      if (!this.focusing) {
        return
      }

      // console.log('::::::::', evt)
      if (!this.focusing) return;

      // ctrlKey
      if (evt.ctrlKey && evt.target.type !== 'textarea' && this.options.mode !== 'read') {
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
      } else {
        // console.log('>>>>>>>>>>>>>>', evt)
        switch (evt.keyCode) {
          case 37: // left
            this.moveLeft()
            evt.returnValue = false
            break;
          case 38: // up
            this.moveUp()
            evt.returnValue = false
            break;
          case 39: // right
            this.moveRight()
            evt.returnValue = false
            break;
          case 40: // down
            this.moveDown()
            evt.returnValue = false
            break;
          case 9: // tab
            this.moveRight();
            evt.returnValue = false
            break;
          case 13:
            this.moveDown();
            evt.returnValue = false
            break;
        }
      

        // 输入a-zA-Z1-9
        if (this.options.mode !== 'read') {
          if (evt.keyCode >= 65 && evt.keyCode <= 90 || evt.keyCode >= 48 && evt.keyCode <= 57 || evt.keyCode >= 96 && evt.keyCode <= 105 || evt.keyCode == 187) {
            // if (this.currentIndexs) {
            // console.log('::::::::', evt.target.type)
            if (evt.target.type !== 'textarea') {
              this.ss.cellText(evt.key, (rindex, cindex, cell) => {
                if (this.editor) {
                  const td = this.td(rindex, cindex)
                  td.html(this.renderCell(rindex, cindex, cell))
                  this.editor.set(td.el, this.ss.currentCell())
                }
              })
            }
          }
        }

      }
      
    });
  }

  reload () {
    this.firsttds = {}
    this.el.html('')
    this.el.children([
      this.colResizer && this.colResizer.el || '',
      this.rowResizer && this.rowResizer.el || '',
      this.buildFixedLeft(),
      this.header = this.buildHeader(),
      this.body = this.buildBody()
    ]);
  }
  
  private moveLeft () {
    if (this.currentIndexs && this.currentIndexs[1] > 0) {
      this.currentIndexs[1] -= 1
      this.moveSelector('left')
    }
  }
  private moveUp () {
    if (this.currentIndexs && this.currentIndexs[0] > 0) {
      this.currentIndexs[0] -= 1
      this.moveSelector('up')
    }
  }
  private moveDown () {
    if (this.currentIndexs && this.currentIndexs[0] < this.ss.rows(this.options.mode === 'read').length) {
      this.currentIndexs[0] += 1
      this.moveSelector('down')
    }
  }
  private moveRight () {
    if (this.currentIndexs && this.currentIndexs[1] < this.ss.cols().length) {
      this.currentIndexs[1] += 1
      this.moveSelector('right')
    }
  }

  // 移动选框
  private moveSelector (direction: 'right' | 'left' | 'up' | 'down') {
    if (this.currentIndexs) {
      const [rindex, cindex] = this.currentIndexs
      const td = this.td(rindex, cindex)
      // console.log('move.td:', td)
      if (td) {
        this.selector.setCurrentTarget(td.el)
        const bodyWidth = this.options.width()
        const bodyHeight = this.options.height()
        const {left, top, width, height} = td.offset()
        // console.log(this.body.el.scrollLeft, ', body-width:', bodyWidth, ', left:', left, ', width=', width)
        const leftDiff = left + width - bodyWidth
        if (leftDiff > 0 && direction === 'right') {
            this.body.el.scrollLeft = leftDiff + 15
        }
        if (direction === 'left' && this.body.el.scrollLeft + 60 > left) {
          this.body.el.scrollLeft -= (this.body.el.scrollLeft + 60 - left)
        }
        if (direction === 'up' && this.body.el.scrollTop > top) {
          this.body.el.scrollTop -= (this.body.el.scrollTop - top)
        }
        if (direction === 'down' && top + height - bodyHeight > 0) {
          this.body.el.scrollTop = top + height - bodyHeight + 15;
        }

        this.mousedownCell(rindex, cindex)
      }
      
    }
  }

  setValueWithText (v: Cell) {
    // console.log('setValueWithText: v = ', v)
    if (this.currentIndexs) {
      this.ss.cellText(v.text, (rindex, cindex, cell) => {
        this.td(rindex, cindex).html(this.renderCell(rindex, cindex, cell))
      })
    }
    this.editor && this.editor.setValue(v)
  }

  setTdWithCell (rindex: number, cindex: number, cell: Cell, autoWordWrap = true) {
    this.setTdStyles(rindex, cindex, cell);
    this.setRowHeight(rindex, cindex, autoWordWrap);
    this.td(rindex, cindex).html(this.renderCell(rindex, cindex, cell));
  }

  setCellAttr (k: keyof Cell, v: any) {
    // console.log('::k:', k, '::v:', v)
    this.ss.cellAttr(k, v, (rindex, cindex, cell) => {
      // console.log(':rindex:', rindex, '; cindex:', cindex, '; cell: ', cell)
      this.setTdWithCell(rindex, cindex, cell, k === 'wordWrap' && v);
    })
    this.editor && this.editor.setStyle(this.ss.currentCell())
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
    // console.log('txt>>>:', this.renderCell(rindex, cindex, cell))
    td.html(this.renderCell(rindex, cindex, cell));
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
          td.html(this.renderCell(rindex, cindex, cell));
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

  // insert
  insert (type: 'row' | 'col', amount: number) {
    if (type === 'col') {
      // insert col
    } else if (type === 'row') {
      // insert row
    }
    this.ss.insert(type, amount, (rindex, cindex, cell) => {
      this.setTdStylesAndAttrsAndText(rindex, cindex, cell)
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
      this.td(rindex, cindex).html(this.renderCell(rindex, cindex, cell));
    })
  }

  private renderCell (rindex: number, cindex: number, cell: Cell | null): string {
    if (cell) {
      const setKey = `${rindex}_${cindex}`
      // console.log('text:', setKey, cell.text && cell.text)
      if (cell.text && cell.text[0] === '=') {
        this.formulaCellIndexs.add(setKey)
      } else {
        if (this.formulaCellIndexs.has(setKey)) {
          this.formulaCellIndexs.delete(setKey)
        }

        this.reRenderFormulaCells()
      }
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
  private reRenderFormulaCells () {
    // console.log('formulaCellIndex: ', this.formulaCellIndexs)
    this.formulaCellIndexs.forEach(it => {
      let rcindexes = it.split('_')
      const rindex = parseInt(rcindexes[0])
      const cindex = parseInt(rcindexes[1])
      // console.log('>>>', this.ss.data, this.ss.getCell(rindex, cindex))
      const text = this.renderCell(rindex, cindex, this.ss.getCell(rindex, cindex))
      this.td(rindex, cindex).html(text);
    })
  }

  private setRowHeight (rindex: number, cindex: number, autoWordWrap: boolean) {
    // console.log('rowHeight: ', this.td(rindex, cindex).offset().height, ', autoWordWrap:', autoWordWrap)
    // 遍历rindex行的所有单元格，计算最大高度
    if (autoWordWrap === false) {
      return ;
    }
    const cols = this.ss.cols()
    const td = this.td(rindex, cindex)
    let h = td.offset().height
    console.log('h:', h)
    const tdRowspan = td.attr('rowspan')
    if (tdRowspan) {
      for (let i = 1; i < parseInt(tdRowspan); i++) {
        let firsttds = this.firsttds[(rindex + i) +'']
        firsttds && (h -= parseInt(firsttds[0].attr('height') || 0) + 1)
      }
    }
    // console.log('after.h:', h)
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
    this.editor && this.editor.reload()
  }
  private changeRowResizer (index: number, distance: number) {
    const h = this.ss.row(index).height + distance
    this.changeRowHeight(index, h);
  }
  private changeColResizer (index: number, distance: number) {
    const w = this.ss.col(index).width + distance
    if (w <= 50) return
    this.ss.col(index, w)
    const cols = this.cols[index+'']
    if (cols) {
      cols.forEach(col => col.attr('width', w))
    }
    this.selector.reload()
    this.editor && this.editor.reload()
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
    const rows = this.ss.rows(this.options.mode === 'read');
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
      .style('height', `${this.options.mode === 'read' ? 'auto' : this.options.height() - 18}px`)
      .children([
        h('table').child(
          h('tbody').children(
            rows.map((row, rindex) => {
              let firstTd = h('td').attr('height', `${row.height}`).child(`${rindex + 1}`)
                .on('mouseover', (evt: Event) => this.rowResizer && this.rowResizer.set(evt.target, rindex, this.body.el.scrollTop));
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
          let th = h('th').child(col.title).on('mouseover', (evt: Event) => {
            console.log(evt)
            this.colResizer && this.colResizer.set(evt.target, index, this.body.el.scrollLeft)
          });
          this.ths[index + ''] = th;
          return th;
        }),
        h('th')
      ]
    ))
    return h().class('spreadsheet-header').style('width', `${this.options.width()}px`).children([
      h('table').children([this.buildColGroup(15), thead])
    ])
  }

  private mousedownCell (rindex: number, cindex: number) {
    if (this.editor) {
      const editorValue = this.editor.value
      if (this.currentIndexs && this.editor.target && editorValue) {
        // console.log(':::editorValue:', editorValue)
        const oldCell = this.ss.cellText(editorValue.text, (_rindex, _cindex, _cell: Cell) => {
          this.td(_rindex, _cindex).html(this.renderCell(_rindex, _cindex, _cell))
        });
        // const oldTd = this.td(this.currentIndexs[0], this.currentIndexs[1]);
        // oldTd.html(this.renderCell(editorValue))
        if (oldCell) {
          // 设置内容之后，获取高度设置行高
          if (oldCell.wordWrap) {
            this.setRowHeight(this.currentIndexs[0], this.currentIndexs[1], true)
          }
          // console.log('old.td.offset:', oldCell)
          // this.editorChange(oldCell)
        }
      }
      this.editor.clear()
    }

    this.currentIndexs = [rindex, cindex]
    const cCell = this.ss.currentCell([rindex, cindex])
    this.clickCell(rindex, cindex, cCell)
  }

  private editCell(rindex: number, cindex: number) {
    const td = this.td(rindex, cindex)
    this.editor && this.editor.set(td.el, this.ss.currentCell())
  }

  private buildBody () {
    const rows = this.ss.rows(this.options.mode === 'read');
    const cols = this.ss.cols();

    const mousedown = (rindex: number, cindex: number, evt: any) => {
      const {select} = this.ss
      if (evt.button === 2) {
        // show contextmenu
        console.log(':::evt:', evt)
        this.contextmenu && this.contextmenu.set(evt)
        if (select && select.contains(rindex, cindex)) {
          return
        }
      }
      // left key
      this.selector.mousedown(evt)
      this.mousedownCell(rindex, cindex)
      this.focusing = true
    }

    const dblclick = (rindex: number, cindex: number) => {
      this.editCell(rindex, cindex)
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
            .child(this.renderCell(rindex, cindex, cell))
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
      .style('height', `${this.options.mode === 'read' ? 'auto' : this.options.height()}px`)
      .style('width', `${this.options.width()}px`)
      .children([
        h('table').children([this.buildColGroup(0), tbody]),
        this.editor && this.editor.el || '',
        this.selector.el,
        this.contextmenu && this.contextmenu.el || '',
        this.dashedSelector.el
      ]
    )
  }

  // 向尾部添加行
  private addRow (num = 1) {
    if (num > 0) {

    }
  }

  private firsttdsPush (index: number, el: Element) {
    this.firsttds[`${index}`] = this.firsttds[`${index}`] || []  
    this.firsttds[`${index}`].push(el)
  }

}