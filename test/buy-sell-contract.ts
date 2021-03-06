export const buySellContract = `
{-# STDLIB_VERSION 3 #-}
{-# CONTENT_TYPE DAPP #-}
{-# SCRIPT_TYPE ACCOUNT #-}

let wavesAssetId = base58'11111111111111111111111111111111'

##READ LOT
func getPrice(data: ByteVector) = data.take(8).toInt()
func getStock(data: ByteVector) = data.drop(8).take(8).toInt() 
func getAmountAsset(data: ByteVector) =  data.drop(8 + 8 + 32).take(32)
func getSeller(data: ByteVector) = data.drop(8 + 8 + 32 + 32)
func getPriceAsset(data: ByteVector) = {
    let pr = data.drop(8 + 8).take(32)
    if pr == wavesAssetId then unit else pr
}

##WRITE LOT
func serialize(lotId: ByteVector | String, price: Int, stock: Int, priceAsset: ByteVector | Unit, amountAsset: ByteVector, seller: ByteVector) = {
    let idAsString = match (lotId) {
        case s:String => s
        case bv:ByteVector => bv.toBase58String()
    }
    let priceAssetBytes = match(priceAsset) {
        case u:Unit => wavesAssetId
        case bv:ByteVector => bv
    }
    DataEntry(idAsString, price.toBytes() + stock.toBytes() + priceAssetBytes + amountAsset + seller)
}

@Callable(i)
func sell(price: Int, priceAsset: ByteVector) = {
    let p = i.payment.extract()

    if p.assetId == unit || p.assetId == wavesAssetId then throw("Invalid asset to sell.") else 
    if priceAsset.size() != 32 then throw("Invalid asset: " + priceAsset.toBase58String() + ", expected price asset size should be 32.") else
    if price <= 0 then throw("Invalid price: " + price.toString() + ", expected price should be greater than zero.") else
    if p.amount <= 0 then throw("Invalid amount for sell: " + p.amount.toString() + ", expected amount should be greater than zero.") else 

    WriteSet([
        serialize(i.transactionId, price, p.amount, priceAsset, i.payment.extract().assetId.extract(), i.callerPublicKey)
    ])
}

@Callable(i)
func cancel(lotId: String) = {
    let data = getBinary(this, lotId).extract()
    let price = data.getPrice()
    let stock = data.getStock()
    let priceAsset = data.getPriceAsset()
    let amountAsset = data.getAmountAsset()
    let seller = data.getSeller()

    if seller != i.callerPublicKey then throw("Only seller can cancel the lot.") else  

    ScriptResult(
        WriteSet([
            serialize(lotId, price, 0, priceAsset, amountAsset, seller)
        ]),
        TransferSet([
            ScriptTransfer(seller.addressFromPublicKey(), stock, amountAsset)
        ])
    )
}

@Callable(i)
func buy(lotId: String, amountToBuy: Int) = {
    let data = getBinary(this, lotId).extract()
    let price = data.getPrice()
    let stock = data.getStock()
    let priceAsset = data.getPriceAsset()
    let amountAsset = data.getAmountAsset()
    let seller = data.getSeller()

    let p = i.payment.extract()

    if stock <= 0 then throw("Lot is closed or cancelled, 0 items in stock.") else 
    if p.assetId == wavesAssetId then throw("Invalid payment asset.") else 
    if amountToBuy <= 0 then throw("Invalid amount to buy: " + amountToBuy.toString() + ", expected amount should be greater than zero.") else 
    if amountToBuy * price != p.amount then throw("Invalid payment amount: " + p.amount.toString() + ", expected amount should be: " + (amountToBuy * price).toString() + ".") else 
    if amountToBuy > stock then throw("Not enough items in stock.") else
    if priceAsset != p.assetId then throw("Invalid payment asset.") else   

    ScriptResult(
        WriteSet([
            serialize(lotId, price, stock - amountToBuy, priceAsset, amountAsset, seller)
        ]),
        TransferSet([
            ScriptTransfer(i.caller, amountToBuy, amountAsset),
            ScriptTransfer(seller.addressFromPublicKey(), price, priceAsset)
        ])
    )
}

`
