import { bind, unbind } from '../event'

export class Element {
  el: HTMLElement;
  _data: {[key: string]: any} = {};
  _clickOutside: any = null;

  constructor (public tag = 'div') {
    this.el = document.createElement(tag)
  }

  data (key: string, value?: any) {
    if (value !== undefined) {
      this._data[key] = value
    }
    return this._data[key]
  }

  on (eventName: string, handler: (evt: any) => any): Element {
    const [first, ...others] = eventName.split('.')
    // console.log('first:', first, ', others:', others)
    this.el.addEventListener(first, (evt: any) => {
      // console.log('>>>', others, evt.button)
      for (let k of others) {
        console.log('::::::::::', k)
        if (k === 'left' && evt.button !== 0) {
          return
        } else if (k === 'right' && evt.button !== 2) {
          return
        } else if (k === 'stop') {
          evt.stopPropagation()
        }
      }
      // console.log('>>>>>>>>>>>>')
      handler(evt)
    })
    return this;
  }

  onClickOutside (cb: () => void): Element {
    this._clickOutside = cb
    return this;
  }

  parent(): any {
    return this.el.parentNode
  }

  class (name: string): Element {
    this.el.className = name
    return this;
  }

  attrs (map: {[key: string]: string} = {}): Element {
    for (let key of Object.keys(map))
      this.attr(key, map[key]);
    return this;
  }

  attr (attr: string, value?: any): any {
    if (value !== undefined) {
      this.el.setAttribute(attr, value);
    } else {
      return this.el.getAttribute(attr)
    }
    return this;
  }
  removeAttr(attr: string): Element {
    this.el.removeAttribute(attr);
    return this;
  }

  offset (): any {
    const { offsetTop, offsetLeft, offsetHeight, offsetWidth } = this.el
    return {top: offsetTop, left: offsetLeft, height: offsetHeight, width: offsetWidth}
  }

  clearStyle () {
    (<any>this.el).style = ''
    return this;
  }

  styles (map: {[key: string]: string} = {}, isClear = false): Element {
    if (isClear) {
      this.clearStyle()
    }
    for (let key of Object.keys(map))
      this.style(key, map[key]);
    return this;
  }

  style (key: string, value?: any): any {
    if (value !== undefined) {
      this.el.style.setProperty(key, value);
    } else {
      return this.el.style.getPropertyValue(key)
    }
    return this;
  }

  contains (el: any) {
    return this.el.contains(el)
  }

  removeStyle (key: string) {
    this.el.style.removeProperty(key)
    return ;
  }

  children (cs: Array<HTMLElement | string | Element>): Element {
    for (let c of cs)
      this.child(c);
    return this;
  }

  child (c: HTMLElement | string | Element): Element {
    if (typeof c === 'string') {
      this.el.appendChild(document.createTextNode(c))
    } else if (c instanceof Element) {
      this.el.appendChild(c.el)
    } else if (c instanceof HTMLElement) {
      this.el.appendChild(c)
    }
    return this;
  }

  html (html?: string) {
    if (html !== undefined) {
      this.el.innerHTML = html
    } else {
      return this.el.innerHTML
    }
    return this;
  }

  val (v?: string) {
    if (v !== undefined) {
      // (<any>this.el).value = v
      (<any>this.el).value = v
    } else {
      return (<any>this.el).value
    }
    return this;
  }

  clone (): any {
    return this.el.cloneNode();
  }

  isHide () {
    return this.style('display') === 'none'
  }

  toggle () {
    if (this.isHide()) {
      this.show()
    } else {
      this.hide()
    }
  }

  disabled (): Element {
    // this.removeClass('disabled')
    this.addClass('disabled')
    return this;
  }
  able (): Element {
    this.removeClass('disabled')
    return this;
  }

  active (flag = true): Element {
    // this.el.className = this.el.className.split(' ').filter(c => c !== 'disabled').join(' ') + ' active'
    // this.removeClass('disabled')
    if (flag)
      this.addClass('active')
    else
      this.deactive()
    return this;
  }
  deactive (): Element {
    return this.removeClass('active')
  }
  isActive (): boolean {
    return this.hasClass('active');
  }

  addClass (cls: string): Element {
    this.el.className = this.el.className.split(' ').concat(cls).join(' ')
    return this;
  }
  removeClass (cls: string) {
    // console.log('before.className: ', this.el.className)
    this.el.className = this.el.className.split(' ').filter(c => c !== cls).join(' ')
    // console.log('after.className: ', this.el.className)
    return this;
  }
  hasClass (cls: string) {
    return this.el.className.indexOf(cls) !== -1
  }

  show (isRemove = false): Element {
    isRemove ? this.removeStyle('display') : this.style('display', 'block');
    // clickoutside
    if (this._clickOutside) {
      this.data('_outsidehandler', (evt: Event) => {
        if (this.contains(evt.target)) {
          return false
        }
        this.hide()
        unbind('click', this.data('_outsidehandler'))
        this._clickOutside && this._clickOutside()
      })
      setTimeout(() => {
        bind('click', this.data('_outsidehandler'))
      }, 0)
    }
    return this;
  }

  hide (): Element {
    this.style('display', 'none');
    if (this._clickOutside) {
      unbind('click', this.data('_outsidehandler'))
    }
    return this;
  }
}

export function h (tag = 'div'): Element {
  return new Element(tag)
}