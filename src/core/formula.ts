import { alphabetIndex, alphabet } from "./alphabet";

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
        return filter(formula, v.substring(v.indexOf('(') + 1, v.lastIndexOf(')')))
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

export const formulaReplaceParam = (param: string, rowDiff: number, colDiff: number): string => {
  return formulaFilterKey(param, (fx, params) => {
    const replaceFormula = (_v: string):string => {
      if (/^[0-9\-\+\*\/()\s]+$/.test(_v.trim())) {
        return _v
      }
      const idx = /\d+/.exec(_v)
      if (idx) {
        let vc = _v.substring(0, idx.index).trim()
        let vr = parseInt(_v.substring(idx.index).trim())
        return `${alphabet(alphabetIndex(vc) + colDiff)}${vr + rowDiff}`
      }
      return _v;
    }

    if (params.indexOf(':') !== -1) {
      params = params.split(':').map(replaceFormula).join(':')
    } else {
      params = params.split(',').map(replaceFormula).join(',')
    }
    return `=${fx.key}(${params})`
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
        let minC = min.substring(0, idx.index).trim()
        let minR = parseInt(min.substring(idx.index).trim())

        let maxC = max.substring(0, maxIdx.index).trim()
        let maxR = parseInt(max.substring(maxIdx.index).trim())
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
    } else {
      paramValues = param.split(',').map(p => {
        // console.log(/^[0-9\-\+\*\/() ]+$/.test(p), p)
        if (/^[0-9\-\+\*\/()\s]+$/.test(p.trim())) {
          try {
            return eval(p)
          } catch (e) {
            return 0
          }
        }
        const idx = /\d+/.exec(p)
        if (idx) {
          const c = p.substring(0, idx.index).trim()
          const r = p.substring(idx.index).trim()
          return renderCell(parseInt(r) - 1, alphabetIndex(c))
        }
        return 0
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