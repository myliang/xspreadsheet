export class Element {
  el: HTMLElement;

  constructor (public tag = 'div') {
    this.el = document.createElement(tag)
  }

  on (eventName: string, handler: (evt: any) => any): Element {
    this.el.addEventListener(eventName, handler)
    return this;
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

  offset (): any {
    const { offsetTop, offsetLeft, offsetHeight, offsetWidth } = this.el
    return {top: offsetTop, left: offsetLeft, height: offsetHeight, width: offsetWidth}
  }

  styles (map: {[key: string]: string} = {}): Element {
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

  active (): Element {
    // this.el.className = this.el.className.split(' ').filter(c => c !== 'disabled').join(' ') + ' active'
    // this.removeClass('disabled')
    this.addClass('active')
    return this;
  }
  deactive (): Element {
    return this.removeClass('active')
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

  show (): Element {
    this.style('display', 'block');
    return this;
  }

  hide (): Element {
    this.style('display', 'none');
    return this;
  }
}

export function h (tag = 'div'): Element {
  return new Element(tag)
}