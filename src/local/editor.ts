import { Element, h } from "./base/element";
import { Cell, getStyleFromCell } from "../core/cell"

export class Editor {
  el: Element;
  target: HTMLElement | null = null; // 选中的当前的element
  value: Cell | null = null; // 选中的当前的cell
  editor: Element;
  textarea: Element;
  textline: Element; // 计算输入文本的宽度用的element
  change: (v: Cell) => void = (v) => {};
  constructor (public defaultRowHeight: number) {

    this.el = h().children([this.editor = h().class('spreadsheet-editor').children([
        this.textarea = h('textarea')
          .on('input', (evt: Event) => this.inputChange(evt)),
        this.textline = h().styles({visibility: 'hidden', overflow: 'hidden', position: 'fixed', top: '0', left: '0'})
      ])
    ]).hide()
  }

  onChange (change: (v: Cell) => void) {
    this.change = change
  }

  set (target: HTMLElement, value: Cell | null) {
    // console.log('set::>>')
    this.target = target;
    const text = this.setValue(value)
    this.el.show();
    (<any>this.textarea.el).setSelectionRange(text.length, text.length);
    setTimeout(() => (<any>this.textarea.el).focus(), 10)
    this.reload();
  }

  setValue (value: Cell | null): string {
    if (value) {
      this.value = value;
      const text = value.text || '';
      this.textarea.val(text);
      this.textline.html(text);
      return text
    } else {
      return '';
    }
  }
  setStyle (value: Cell | null): void {
    if (value) {
      let attrs = {width: this.textarea.style('width'), height: this.textarea.style('height')}
      this.textarea.styles(Object.assign(attrs, getStyleFromCell(value)), true)
    }
  }

  clear () {
    // console.log('clear:>>>')
    this.el.hide();
    this.target = null;
    this.value = null;
    this.textarea.val('')
    this.textline.html('')
  }

  private inputChange (evt: any) {
    const v = evt.target.value
    if (!/^\s*$/.test(v)) {
      if (this.value) {
        this.value.text = v
      } else {
        this.value = {text: v}
      }
    }
    this.textline.html(v);
    this.reload()
  }

  reload () {
    // setTimeout(() => {
      if (this.target) {
        const { offsetTop, offsetLeft, offsetWidth, offsetHeight } = this.target
        this.editor.styles({left: `${offsetLeft - 1}px`, top: `${offsetTop - 1}px`})
        this.textarea.styles({width: `${offsetWidth - 8}px`, height: `${offsetHeight - 2}px`})
        let ow = this.textline.offset().width + 16
        // console.log(maxWidth, ow, '>>>>')
        if (this.value) {
          if (this.value.wordWrap) {
            // 如果单元格自动换行，那么宽度固定，高度变化
            // this.textarea.style('height', 'auto');
            const h = (parseInt(ow / offsetWidth + '') + (ow % offsetWidth > 0 ? 1 : 0)) * this.defaultRowHeight;
            if (h > offsetHeight) {
              this.textarea.style('height', `${h}px`);
            }
          } else {
            const clientWidth = document.documentElement.clientWidth
            const maxWidth = clientWidth - offsetLeft - 24
            if (ow > offsetWidth) {
              if (ow > maxWidth) {
                // console.log(':::::::::', ow, maxWidth)
                const h = (parseInt(ow / maxWidth + '') + (ow % maxWidth > 0 ? 1 : 0)) * this.defaultRowHeight;
                if (h > offsetHeight) {
                  this.textarea.style('height', `${h}px`)
                } else {
                  this.textarea.style('height', `${offsetHeight}px`)
                }
                ow = maxWidth
              }
              this.textarea.style('width', `${ow}px`)
            }
          }
        }
      }
    // }, 0)
    
  }
}