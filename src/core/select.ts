export class Select {
  constructor(public start: [number, number], public stop: [number, number], public canMerge: boolean) {}
  forEach (cb: (r:number, c: number, rindex: number, cindex: number, rowspan: number, colspan: number) => void): void {
    const [sx, sy] = this.start
    const [ex, ey] = this.stop
    for (let i = sx; i <= ex; i++) {
      for (let j = sy; j <= ey; j++) {
        cb(i, j, i - sx, j - sy, ex - sx + 1, ey - sy + 1)
      }
    }
  }
  rowIndex (index: number) {
    return this.start[0] + index % this.rowLen()
  }
  colIndex (index: number) {
    return this.start[1] + index % this.colLen()
  }
  rowLen () {
    return this.stop[0] - this.start[0] + 1
  }
  colLen () {
    return this.stop[1] - this.start[1] + 1
  }
  cellLen () {
    return this.rowLen() * this.colLen()
  }
  contains (rindex: number, cindex: number) {
    const [sx, sy] = this.start
    const [ex, ey] = this.stop
    return sx <= rindex && ex >= rindex && sy <= cindex && ey >= cindex
  }
}

// export function buildSelect (start: any, end: )