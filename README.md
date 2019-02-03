# XSpreadsheet

[![npm package](https://img.shields.io/npm/v/xspreadsheet.svg)](https://www.npmjs.org/package/xspreadsheet)
[![NPM downloads](http://img.shields.io/npm/dm/xspreadsheet.svg)](https://npmjs.org/package/xspreadsheet)

> a javascript spreadsheet for web

<p align="center">
  <a href="https://github.com/myliang/xspreadsheet">
    <img width="100%" src="/docs/demo.png?raw=true">
  </a>
</p>

## Install
```shell
npm install typescript --save-dev
npm install awesome-typescript-loader --save-dev
npm install xspreadsheet --save-dev
```

## Quick Start

``` javascript
import xspreadsheet from 'xspreadsheet'

const x = xspreadsheet(document.getElementById('#id'))
x.change = (data) => {
  console.log('data:', data)
}

// edit
// data is param in the change method
xspreadsheet(document.getElementById('#id'), {d: data})
```

### in tsconfig.json
```
{
  "compilerOptions": {
    ....
    "types": ["xspreadsheet"],
    ....
  }
}

```

## Browser Support
Modern browsers and Internet Explorer 9+(no test).

## LICENSE
MIT
