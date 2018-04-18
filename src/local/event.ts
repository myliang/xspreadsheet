export function bind<T extends Event>(name: string, fn: (evt: T) => void, target: any = window) {
  target.addEventListener(name, fn)
}
export function unbind<T extends Event>(name: string, fn: (evt: T) => void, target: any = window) {
  target.removeEventListener(name, fn)
}
export function mouseMoveUp<T extends Event> (movefunc: (evt: T) => void, upfunc: (evt: T) => void) {
  bind('mousemove', movefunc)
  const up = (evt: T) => {
    unbind('mousemove', movefunc)
    unbind('mouseup', up)
    upfunc(evt)
  }
  bind('mouseup', up)
}