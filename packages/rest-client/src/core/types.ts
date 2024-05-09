export type LazyTypes = string | number | object | Array<any>
export type MaybeLazy<T extends LazyTypes> = T | (() => T)
