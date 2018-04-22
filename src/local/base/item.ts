import { Element } from "./element";
import { Icon, buildIcon } from "./icon";

export class Item extends Element {

  iconEl: Icon | null = null;

  static build (): Item {
    return new Item()
  }
  
  constructor () {
    super();
    this.class('spreadsheet-item');
  }

  icon (name: string) {
    this.child(this.iconEl = buildIcon(name))
    return this;
  }

  replaceIcon (name: string) {
    this.iconEl && this.iconEl.replace(name)
  }

}

export function buildItem (): Item {
  return new Item();
}