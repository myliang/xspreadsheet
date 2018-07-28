import { Element, h } from "./element";

const colorss = [
  ['#c00000', '#ff0000', '#ffc003', '#ffff00','#91d051', '#00af50', '#00b0f0', '#0070c0', '#002060', '#70309f'],
  ['#ffffff', '#000000', '#e7e6e6', '#44546a', '#4472c4', '#ed7d31', '#a5a5a5', '#ffc003', '#5b9bd5', '#70ad47'],
  ['#f4f5f8', '#848484', '#d0cece', '#d6dce4', '#d9e2f2', '#fae5d5', '#ededed', '#fff2cc', '#deebf6', '#e2efd9'],
  ['#d8d8d8', '#595959', '#afabab', '#adb9ca', '#b4c6e7', '#f7cbac', '#dbdbdb', '#fee598', '#bdd7ee', '#c5e0b3'],
  ['#bfbfbf', '#3f3f3f', '#757070', '#8496b0', '#8eaad8', '#f4b183', '#c9c9c9', '#ffd964', '#9dc2e5', '#a8d08d'],
  ['#a5a5a5', '#262626', '#3a3838', '#333f4f', '#2f5496', '#c55b11', '#7b7b7b', '#bf9001', '#2e75b5', '#538135'],
  ['#7e7e7e', '#0c0c0c', '#171616', '#232a35', '#1e3864', '#833d0b', '#525252', '#7e6000', '#1f4e79', '#375623']
]

export class ColorPanel extends Element {

  constructor (click: (color: string) => void) {
    super();
    this.class('spreadsheet-color-panel')
    .child(
      h('table').child(
        h('tbody').children(
          colorss.map(colors => {
            return h('tr').children(
              colors.map(color => {
                return h('td').child(
                  h()
                    .class('color-cell')
                    .on('click', click.bind(null, color))
                    .style('background-color', color)
                )
              })
            )
          })
        )));
  }

}

export function buildColorPanel (click: (color: string) => void) {
  return new ColorPanel(click);
}