import { Element, h } from "./element";
import { buildIcon } from "./icon";

export class Dropdown extends Element {
  content: Element;
  title: Element;

  constructor (title: string | Element, width: string, contentChildren: Element[]) {
    super();
    this.class('spreadsheet-dropdown spreadsheet-item');

    this.content = h().class('spreadsheet-dropdown-content')
      .children(contentChildren)
      .on('click', (evt) => this.toggleHandler(evt))
      .style('width', width).hide();

    this.child(h().class('spreadsheet-dropdown-header').children([
      this.title = typeof title === 'string' ? h().class('spreadsheet-dropdown-title').child(title) : title,
      h().class('spreadsheet-dropdown-icon').on('click', (evt) => this.toggleHandler(evt)).child(buildIcon('arrow-down'))
    ])).child(this.content);
  }

  documentHandler (e: any) {
    if (this.content.el.contains(e.target)) {
      return false
    }
    this.content.hide()
    this.deactive()
    document.removeEventListener('click', this.content.data('_outsidehandler'))
  }

  toggleHandler (evt: Event) {
    // evt.stopPropagation()
    // console.log(this.content.isHide(), ">>>")
    if (this.content.isHide()){
      const clickoutsize = (evt: Event) => {
        this.documentHandler(evt)
      }

      this.content.show()
      this.active()
      this.content.data('_outsidehandler', clickoutsize)
      setTimeout(() => {
        document.addEventListener('click', clickoutsize)
      }, 0)
    } else {
      this.content.hide()
      this.deactive()
      document.removeEventListener('click', this.content.data('_outsidehandler'))
    }
  }
}
export function buildDropdown(title: string | Element, width: string, contentChildren: Element[]) {
  return new Dropdown(title, width, contentChildren)
}