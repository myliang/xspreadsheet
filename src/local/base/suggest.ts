import { Element, h } from "./element";
import { buildItem } from "./item";
import { buildMenu } from "./menu";
import { bind, unbind } from "../event";

export class Suggest extends Element {
  
  filterList: Array<Element> = [];
  currentIndex = 0;
  target: Element | null = null;
  evtTarget: Element | null = null;

  itemClick: (it: [string, string]) => void = (it) => {}

  constructor (public list: Array<[string, string]>, public width: number) {
    super();
    this.class('spreadsheet-suggest').hide()
  }

  private documentHandler (e: any) {
    if (this.el.contains(e.target)) {
      return false
    }
    this.hideAndRemoveEvents()
  }
  private documentKeydownHandler (e: any) {
    console.log('keyCode: ', e)
    if (this.filterList.length <= 0 && e.target.type !== 'textarea') return ;

    switch (e.keyCode) {
      case 37: // left
        e.returnValue = false
        break;
      case 38: // up
        this.filterList[this.currentIndex].deactive()
        this.currentIndex--
        if (this.currentIndex < 0) {
          this.currentIndex = this.filterList.length - 1
        }
        this.filterList[this.currentIndex].active()
        e.returnValue = false
        e.stopPropagation();
        break;
      case 39: // right
        e.returnValue = false
        break;
      case 40: // down
        this.filterList[this.currentIndex].deactive()
        this.currentIndex++
        if (this.currentIndex > this.filterList.length - 1) {
          this.currentIndex = 0
        }
        this.filterList[this.currentIndex].active()
        e.returnValue = false
        break;
      case 13: // enter
        this.filterList[this.currentIndex].el.click()
        e.returnValue = false
        break;
    }
    e.stopPropagation();
  }

  private hideAndRemoveEvents () {
    this.hide()
    this.removeEvents();
  }
  private removeEvents () {
    if (this.evtTarget !== null) {
      unbind('click', this.data('_outsidehandler'), this.evtTarget.el)
      unbind('keydown', this.data('_keydownhandler'), this.evtTarget.el)
    }
  }

  private clickItemHandler (it: [string, string]) {
    // console.log('click.it: ', it)
    this.itemClick(it)
    this.hideAndRemoveEvents()
  }


  search (target: Element, input: Element, word: string) {
    this.removeEvents()
    this.target = target;
    this.evtTarget = input;

    const { left, top, width, height } = target.offset()
    this.styles({left: `${left}px`, top: `${top + height + 2}px`, width: `${this.width}px`})

    let lis: any = this.list
    if (!/^\s*$/.test(word)) {
      lis = this.list.filter(it => it[0].startsWith(word.toUpperCase()))
    }
    lis = lis.map((it: [string, string]) => {
      const item = buildItem().on('click', (evt) => this.clickItemHandler(it)).child(it[0])
      if (it[1]) {
        item.child(h().class('label').html(it[1]))
      }
      return item
      // return `<div class="spreadsheet-item" it-key="${it[0]}">${it[0]}${it[1] ? '<div class="label">'+it[1]+'</div>' : ''}</div>`
    })

    this.filterList = lis
    this.currentIndex = 0

    if (lis.length <= 0) {
      lis = [buildItem().child('No Result')] // `<div class="spreadsheet-item disabled">No Result</div>`
    } else {
      lis[0].active()

      // clickoutside
      this.data('_outsidehandler', (evt: Event) => {
        this.documentHandler(evt)
      })
      this.data('_keydownhandler', (evt: any) => this.documentKeydownHandler(evt))
      setTimeout(() => {
        if (this.evtTarget !== null) {
          bind('click', this.data('_outsidehandler'), this.evtTarget.el)
          bind('keydown', this.data('_keydownhandler'), this.evtTarget.el)
        }
      }, 0)
    }
    this.html(``)
    this.child(buildMenu().children(lis)).show()
  }
}