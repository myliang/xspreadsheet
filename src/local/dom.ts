import {bind, unbind} from './event'
interface ElementOptions {
  className?: string;
  style?: {[key: string]: string};
  attrs?: {[key: string]: string};
  on?: {[key: string]: (evt: Event) => void}
}

export function createElement (tag: string, options: ElementOptions = {}, childrens: string | Array<Node|string> = []): HTMLElement {
  const ele = document.createElement(tag)
  if (options.className) {
    ele.setAttribute('class', options.className)
  }
  if (options.style) {
    for (let key of Object.keys(options.style))
      ele.style.setProperty(key, options.style[key])
  }
  if (options.attrs) {
    for (let attr of Object.keys(options.attrs))
      if (options.attrs) ele.setAttribute(attr, options.attrs[attr])
  }
  if (options.on) {
    for (let key of Object.keys(options.on))
      bind(key, options.on[key], ele)
  }
  if (typeof childrens === 'string') {
    ele.appendChild(document.createTextNode(childrens))
  } else if (childrens && childrens.length > 0) {
    childrens.forEach(child => 
      ele.appendChild(typeof child === 'string' ? document.createTextNode(child) : child)
    )
  }
  return ele;
}

export function createIcon (name: string, style = {}): HTMLElement {
  return createElement('div', {className: 'spreadsheet-icon', style}, [
    createElement('div', {className: `spreadsheet-icon-img ${name}`})
  ])
}

export function createItem (clickHandler: (evt: Event) => void, children: Array<Node|string> | string): HTMLElement {
  return createElement('div', {className: 'spreadsheet-item', on: {click: clickHandler}}, children)
}

export function createMenu (children: Array<HTMLElement>, align = 'vertical'): HTMLElement {
  return createElement('div', {className: `spreadsheet-menu ${align}`}, children)
}

const colorss = [
  ['rgb(192, 0, 0)', 'rgb(255, 0, 0)', 'rgb(255, 192, 3)', 'rgb(255, 255, 0)','rgb(145, 208, 81)', 'rgb(0, 175, 80)', 'rgb(0, 176, 240)', 'rgb(0, 112, 192)', 'rgb(0, 32, 96)', 'rgb(112, 48, 159)'],
  ['rgb(255, 255, 255)', 'rgb(0, 0, 0)', 'rgb(231, 230, 230)', 'rgb(68, 84, 106)', 'rgb(68, 114, 196)', 'rgb(237, 125, 49)', 'rgb(165, 165, 165)', 'rgb(255, 192, 3)', 'rgb(91, 155, 213)', 'rgb(112, 173, 71)'],
  ['rgb(244, 245, 248)', 'rgb(132, 132, 132)', 'rgb(208, 206, 206)', 'rgb(214, 220, 228)', 'rgb(217, 226, 242)', 'rgb(250, 229, 213)', 'rgb(237, 237, 237)', 'rgb(255, 242, 204)', 'rgb(222, 235, 246)', 'rgb(226, 239, 217)'],
  ['rgb(216, 216, 216)', 'rgb(89, 89, 89)', 'rgb(175, 171, 171)', 'rgb(173, 185, 202)', 'rgb(180, 198, 231)', 'rgb(247, 203, 172)', 'rgb(219, 219, 219)', 'rgb(254, 229, 152)', 'rgb(189, 215, 238)', 'rgb(197, 224, 179)'],
  ['rgb(191, 191, 191)', 'rgb(63, 63, 63)', 'rgb(117, 112, 112)', 'rgb(132, 150, 176)', 'rgb(142, 170, 216)', 'rgb(244, 177, 131)', 'rgb(201, 201, 201)', 'rgb(255, 217, 100)', 'rgb(157, 194, 229)', 'rgb(168, 208, 141)'],
  ['rgb(165, 165, 165)', 'rgb(38, 38, 38)', 'rgb(58, 56, 56)', 'rgb(51, 63, 79)', 'rgb(47, 84, 150)', 'rgb(197, 91, 17)', 'rgb(123, 123, 123)', 'rgb(191, 144, 1)', 'rgb(46, 117, 181)', 'rgb(83, 129, 53)'],
  ['rgb(126, 126, 126)', 'rgb(12, 12, 12)', 'rgb(23, 22, 22)', 'rgb(35, 42, 53)', 'rgb(30, 56, 100)', 'rgb(131, 61, 11)', 'rgb(82, 82, 82)', 'rgb(126, 96, 0)', 'rgb(31, 78, 121)', 'rgb(55, 86, 35)']
]

export function createColorPanel (click: (color: string) => void) {
  return createElement('div', {className: 'spreadsheet-color-panel'}, [
    createElement('table', {}, [
      createElement('tbody', {},
        colorss.map(colors => {
          return createElement('tr', {}, colors.map(c => {
            return createElement('td', {}, [
              createElement('div', {className: 'color-cell', style: {'background-color': c}, on: {click: click.bind(null, c)}})
            ])
          }))
        })
      )
    ])
  ])
}

export function createDropdown (title: string | Node, width: string = 'auto', content: Node): HTMLElement {
  const root = createElement('div', {className: 'spreadsheet-dropdown spreadsheet-item'})
  const c = createElement('div',
    {className: 'spreadsheet-dropdown-content', style: {width, display: 'none'}},
    [content])

  let documentHandler = (e: any) => {
    if (root.contains(e.target)) {
      return false
    }
    c.style.display = 'none'
    unbind('click', documentHandler, document)
  }

  const toggleHandler = (evt: Event) => {
    // evt.stopPropagation()
    if (c.style.display === 'none') {
      c.style.display = 'block'
      bind('click', documentHandler, document)
    } else {
      c.style.display = 'none'
      unbind('click', documentHandler, document)
    }
  }
  bind('click', toggleHandler, c)
  
  root.appendChild(createElement('div', {className: 'spreadsheet-dropdown-header'}, [
    typeof title === 'string' ? createElement('div', {className: 'spreadsheet-dropdown-title'}, title) : title,
    createElement('div', {className: 'spreadsheet-dropdown-icon', on: {click: toggleHandler}}, [
      createIcon('arrow-down')
    ])
  ]))
  root.appendChild(c)
  return root
}