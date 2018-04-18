import { Element } from "./element";

export class Item extends Element {

  static build (): Item {
    return new Item()
  }
  
  constructor () {
    super();
    this.class('spreadsheet-item');
  }

}

export function buildItem () {
  return new Item();
}