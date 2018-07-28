import { Element, h } from "./base/element";
import { Suggest } from "./base/suggest";
import { Cell, getStyleFromCell } from "../core/cell"
import { Formula } from "../core/formula";

export class Editor {
  el: Element;
  target: HTMLElement | null = null; // 选中的当前的element
  value: Cell | null = null; // 选中的当前的cell
  editor: Element;
  textarea: Element;
  textline: Element; // 计算输入文本的宽度用的element
  suggest: Suggest; // autocomplete show

  change: (v: Cell) => void = (v) => {};
  constructor (public defaultRowHeight: number, public formulas : Array<Formula>) {
    const suggestList: any = formulas.map(it => [it.key, it.title])
    this.el = h().children([this.editor = h().class('spreadsheet-editor').children([
        this.textarea = h('textarea')
          .on('keydown', (evt: any) => this.inputKeydown(evt))
          .on('input', (evt: Event) => this.inputChange(evt)),
        this.textline = h().styles({visibility: 'hidden', overflow: 'hidden', position: 'fixed', top: '0', left: '0'})
      ])
    , this.suggest = new Suggest(suggestList, 180)]).hide()

    this.el.on('keydown', (evt: any) => {
      if (evt.keyCode !== 13 && evt.keyCode !== 9) {
        evt.stopPropagation();
      }
    })

    this.suggest.itemClick = (it) => {
      // console.log('>>>>>>>>>>>>', it)
      const text = `=${it[0]}()`;
      if (this.value) {
        this.value.text = text
      }
      this.textarea.val(text);
      this.textline.html(text);
      this.setTextareaRange(text.length - 1)
      // (<any>this.textarea.el).setSelectionRange(text.length + 1, text.length + 1);
      // setTimeout(() => (<any>this.textarea.el).focus(), 10)
    }
  }

  onChange (change: (v: Cell) => void) {
    this.change = change
  }

  set (target: HTMLElement, value: Cell | null) {
    // console.log('set::>>')
    this.target = target;
    const text = this.setValue(value)
    this.el.show();
    this.setTextareaRange(text.length)
    // (<any>this.textarea.el).setSelectionRange(text.length, text.length);
    // setTimeout(() => (<any>this.textarea.el).focus(), 10)
    this.reload();
  }

  setValue (value: Cell | null): string {
    this.setStyle(value);
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
    let attrs = {width: this.textarea.style('width'), height: this.textarea.style('height')}
    this.textarea.styles(Object.assign(attrs, getStyleFromCell(value)), true)
  }

  clear () {
    // console.log('clear:>>>')
    this.el.hide();
    this.target = null;
    this.value = null;
    this.textarea.val('')
    this.textline.html('')
  }

  private setTextareaRange (position: number) {
    setTimeout(() => {
      (<any>this.textarea.el).setSelectionRange(position, position);
      (<any>this.textarea.el).focus()
    }, 10)
  }

  private inputKeydown (evt: any) {
    if (evt.keyCode === 13) {
      evt.preventDefault()
    }
  }

  private inputChange (evt: any) {
    const v = evt.target.value
    if (this.value) {
      this.value.text = v
    } else {
      this.value = {text: v}
    }
    this.change(this.value)
    this.autocomplete(v);

    this.textline.html(v);
    this.reload()

  }

  private autocomplete (v: string) {
    if (v[0] === '=') {
      if (!v.includes('(')) {
        const search = v.substring(1)
        console.log(':::;search word:', search)
        this.suggest.search(this.editor, this.textarea, search);
      } else {
        this.suggest.hide()
      }
    } else {
      this.suggest.hide()
    }
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
        this.el.show()
      }
    // }, 0)
    
  }
}