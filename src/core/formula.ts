import { alphabetIndex } from "./alphabet";

export interface Formula {
  key: string;
  title: string;
  render(ary: Array<number>): number
}

export const formulaFilterKey = (v: string, filter: (formula: Formula, param: string) => string) => {
  if (v[0] === '=') {
    const fx = v.substring(1, v.indexOf('('))
    for (let formula of formulas) {
      if (formula.key.toLowerCase() === fx.toLowerCase()) {
        return filter(formula, v.substring(v.indexOf('(') + 1, v.indexOf(')')))
      }
    }
  }
  return v
}

export const formulaRender = (v: string, renderCell: (rindex: number, cindex: number) => any) => {
  return formulaFilterKey(v, (fx, param) => {
    return fx.render(formulaParamToArray(param, renderCell)) + '';
  })
}

const formulaParamToArray = (param: string, renderCell: (rindex: number, cindex: number) => any) => {
  let paramValues = []
  try {
    if (param.indexOf(':') !== -1) {
      const [min, max] = param.split(':');
      const idx = /\d+/.exec(min);
      const maxIdx = /\d+/.exec(max);
      if (idx && maxIdx) {
        // idx = idx.index;
        // maxIdx = maxIdx.index;
        let minC = min.substring(0, idx.index)
        let minR = parseInt(min.substring(idx.index))

        let maxC = max.substring(0, maxIdx.index)
        let maxR = parseInt(max.substring(maxIdx.index))
        // console.log(min, max, minR, maxR, minC, maxC)
        if (maxC === minC) {
          for (let i = minR; i <= maxR; i++) {
            // console.log('value:::', i-1, alphabetIndex(minC), renderCell(i - 1, alphabetIndex(minC)))
            paramValues.push(renderCell(i - 1, alphabetIndex(minC)))
          }
        } else {
          for (let i = alphabetIndex(minC); i <= alphabetIndex(maxC); i++) {
            paramValues.push(renderCell(minR - 1, i))
          }
        }
      }
    } else if (param.indexOf(',') !== -1) {
      paramValues = param.split(',').map(p => {
        const idx = /\d+/.exec(p)
        if (idx) {
          const c = p.substring(0, idx.index)
          const r = p.substring(idx.index)
          return renderCell(parseInt(r) - 1, alphabetIndex(c))
        }
      })
    }
  } catch (e) {
    console.log('warning:', e)
  }
  return paramValues;
}

export const formulas: Array<Formula> = [
  {key: 'SUM', title: '求和', render: (vv) => vv.reduce((a, b) => Number(a) + Number(b), 0)},
  {key: 'AVERAGE', title: '平均值', render: (vv) => vv.reduce((a, b) => Number(a) + Number(b), 0) / vv.length},
  {key: 'MAX', title: '最大值', render: (vv) => Math.max(...vv.map(v => Number(v)))},
  {key: 'MIN', title: '最小值', render: (vv) => Math.min(...vv.map(v => Number(v)))}
]