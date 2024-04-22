import { client, send, positions } from '../clients/okx.js'
import { insts } from '../config.js'

export const formatPrice = (price, rate = 0, digits = 5) =>
	(price * (1 + rate)).toFixed(digits)

export async function order({
	symbol,
	price = 0,
	quantity,
	side = 'buy',
	tp = 0,
	sl = 0,
	tag = ''
}) {
	//const pos = positions.get(symbol)
	const args = {
		instId: symbol,
		tdMode: 'isolated',
		sz: quantity + '',
		side,
		//posSide: (side == 'buy') ^ (!!pos?.pos) ? 'long' : 'short',
		ordType: price ? 'post_only' : 'market'
	}
	const digits = insts[symbol].digits
	if (price) {
		args.px = formatPrice(price, 0, digits)
	}
	console.log('trade', symbol, side, args.px)
	if (tp) {
		tp = formatPrice(price, side == 'buy' ? tp : -tp, digits)
		args.tpOrdKind = 'limit'
		args.tpTriggerPx = tp
		args.tpOrdPx = tp
	}
	if (sl) {
		sl = formatPrice(price, side == 'buy' ? -sl : sl, digits)
		args.slTriggerPx = sl
		args.slOrdPx = -1
	}
	if (tag)
		args.tag = tag
	return client.submitOrder(args)
}

export const buy = async (symbol, quantity, price = 0, tp = 0, sl = 0, tag = '') => order({
	symbol,
	quantity,
	price,
	tp,
	sl,
	tag
}),
	sell = async (symbol, quantity, price = 0, tp = 0, sl = 0, tag = '') => order({
		symbol,
		quantity,
		price,
		side: 'sell',
		tp,
		sl,
		tag
	})

export function cancelOrder(symbol, ordId) {
	return send('cancel-order', [{ instId: symbol, ordId }])
}