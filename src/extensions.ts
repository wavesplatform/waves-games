interface Array<T> {
  toRecord(map?: (item: T) => string): Record<string, T>
  removeLast(): T[]
  removeFirst(): T[]
  firstOrUndefined(): T | undefined
  firstOrDefault(d: T): T
  first(): T
  lastOrUndefined(): T | undefined
  lastOrDefault(d: T): T
  last(): T
  tryMapOrUndefined<TOut>(map: (item: T) => TOut): (TOut | undefined)[]
  min(map: (item: T) => number): T
  max(map: (item: T) => number): T
  sum(map: (item: T) => number): number
  minMax(map: (item: T) => number): { min: T; max: T }
  minMaxIndex(map: (item: T) => number): { min: number; max: number }
  minIndex(map: (item: T) => number): number
  maxIndex(map: (item: T) => number): number
  any(predicate?: (item: T) => boolean): boolean
  orderBy(orderProp: (item: T) => keyof T): T[]
}

Array.prototype.tryMapOrUndefined = function<T, TOut>(this: T[], map: (item: T) => TOut) {
  return this.map((x: T) => {
    try {
      return map(x)
    } catch (error) {
      return undefined
    }
  })
}

Array.prototype.any = function<T>(this: T[], predicate?: (item: T) => boolean) {
  for (let i = 0; i < this.length; i++) {
    if (!predicate || predicate(this[i])) return true
  }
  return false
}

Array.prototype.toRecord = function<T>(this: T[], map: (item: T) => string) {
  return this.reduce((a, b) => ({ ...a, [map(b)]: b }), {})
}

Array.prototype.firstOrUndefined = function<T>(this: T[]) {
  return this.length > 0 ? this[0] : undefined
}

Array.prototype.firstOrDefault = function<T>(d: T) {
  return this.length > 0 ? this[0] : d
}

Array.prototype.first = function() {
  if (this.length > 0) return this[0]

  throw new Error('Array is empty.')
}

Array.prototype.removeFirst = function() {
  if (this.length > 0) return this.splice(1)

  throw new Error('Array is empty.')
}

Array.prototype.removeLast = function() {
  if (this.length > 0) return this.splice(0, this.length - 1)

  throw new Error('Array is empty.')
}

Array.prototype.lastOrUndefined = function() {
  return this.length > 0 ? this[this.length - 1] : undefined
}

Array.prototype.lastOrDefault = function<T>(d: T) {
  return this.length > 0 ? this[this.length - 1] : d
}

Array.prototype.last = function() {
  if (this.length > 0) return this[this.length - 1]

  throw new Error('Array is empty.')
}

Array.prototype.sum = function<T>(map: (item: T) => number) {
  return this.map(map).reduce((a: number, b: number) => a + b, 0)
}

Array.prototype.minIndex = function<T>(map: (item: T) => number) {
  return this.minMaxIndex(map).min
}

Array.prototype.maxIndex = function<T>(map: (item: T) => number) {
  return this.minMaxIndex(map).max
}

Array.prototype.min = function<T>(map: (item: T) => number) {
  return this[this.minIndex(map)]
}

Array.prototype.minMaxIndex = function<T>(map: (item: T) => number) {
  let min: number
  let max: number
  let minIndex = 0
  let maxIndex = 0
  for (let i = 0; i < this.length; i++) {
    const element = this[i]
    const value = map(element)
    min = Math.min(value, min || value)
    max = Math.max(value, max || value)
    if (max === value) {
      maxIndex = i
    }
    if (min === value) {
      minIndex = i
    }
  }
  return { min: minIndex, max: maxIndex }
}

Array.prototype.max = function<T>(map: (item: T) => number) {
  return this[this.maxIndex(map)]
}

Array.prototype.minMax = function<T>(map: (item: T) => number) {
  const { min, max } = this.minMaxIndex(map)
  return { min: this[min], max: this[max] }
}

Array.prototype.orderBy = function<T>(orderProp: (item: T) => keyof T): T[] {
  const tmp = new Array<T>(...this)
  return tmp.sort((a, b) => {
    const aProp = orderProp(a)
    const bProp = orderProp(b)
    return aProp > bProp ? 1 : aProp < bProp ? -1 : 0
  })
}
