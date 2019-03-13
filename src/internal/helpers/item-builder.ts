import { address } from '@waves/waves-crypto'
import { Item, ItemParams } from '../types'
import { IssueTransaction } from '@waves/waves-rest'

export class ItemBuilder {
  private _issueTx: IssueTransaction
  private _itemParams: ItemParams<any>

  constructor(issueTx: IssueTransaction) {
    this._issueTx = issueTx
  }

  setItemParams(itemParams: ItemParams<any>): ItemBuilder {
    this._itemParams = itemParams
    return this
  }

  build(): Item {
    if (!this._itemParams) {
      throw Error('Item params not set')
    }

    const { name, imageUrl, misc } = this._itemParams
    const { id, senderPublicKey, quantity, reissuable, timestamp } = this._issueTx

    return {
      id,
      gameId: address(senderPublicKey),
      name,
      imageUrl,
      quantity,
      reissuable,
      misc,
      rawParams: this._itemParams,
      timestamp,
    }
  }
}
