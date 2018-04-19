import { Element, h } from "./base/element";
import { Cell } from "../core/cell"

export class Editor {
  el: Element;
  target: HTMLElement | null = null; // 选中的当前的element
  value: Cell | null = null; // 选中的当前的cell
  editor: Element;
  textarea: Element;
  textline: Element; // 计算输入文本的宽度用的element
  // change: (v: string) => void;
  constructor () {

    this.el = h().children([this.editor = h().class('spreadsheet-editor').children([
        this.textarea = h('textarea').on('input', (evt: Event) => this.inputChange(evt)),
        this.textline = h().styles({visibility: 'hidden', overflow: 'hidden', position: 'fixed', top: '0', left: '0'})
      ])
    ]).hide()
  }

  set (target: HTMLElement, value: Cell) {
    // console.log('set::>>')
    this.target = target;
    this.value = value;
    const text = value.text || '';
    this.textarea.val(text);
    this.textline.html(text);
    this.el.show();
    (<any>this.textarea.el).setSelectionRange(text.length, text.length);
    setTimeout(() => (<any>this.textarea.el).focus(), 10)
    this.reload();
  }

  clear () {
    // console.log('clear:>>>')
    this.el.hide()
    this.target = null;
    this.value = null;
    this.textarea.val('')
    this.textline.html('')
  }

  private inputChange (evt: any) {
    const v = evt.target.value
    if (this.value) {
      this.value.text = v
      this.textline.html(v);
      if (this.target)
        this.target.innerHTML = v
      this.reload()
    }
  }

  reload () {
    // setTimeout(() => {
      if (this.target) {
        const { offsetTop, offsetLeft, offsetWidth, offsetHeight } = this.target
        this.editor.styles({left: `${offsetLeft - 1}px`, top: `${offsetTop - 1}px`})
        this.textarea.styles({width: `${offsetWidth - 8}px`, height: `${offsetHeight - 2}px`})
        const clientWidth = document.documentElement.clientWidth
        const maxWidth = clientWidth - offsetLeft - 24
        let ow = this.textline.offset().width + 16
        console.log(maxWidth, ow, '>>>>')
        if (ow > offsetWidth) {
          if (ow > maxWidth) {
            const h = (parseInt(ow / maxWidth + '') + 1) * 20
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
    // }, 0)
    
  }
}