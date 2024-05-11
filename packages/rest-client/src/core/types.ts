export type LazyTypes = string | number | object | Array<any> | undefined
export type MaybeLazy<T extends LazyTypes> = T | (() => T)
