export type Versions = 1

export interface IVersion<TVersion extends Versions> {
  version: TVersion
}
