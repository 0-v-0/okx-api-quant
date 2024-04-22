import { wsc, handlers, client, orders, positions } from '../clients/okx.js'
import { insts } from '../config.js'
import { buy, sell, cancelOrder } from './order.js'
import { getEMA } from './indicators.js'

const channels = ['positions', 'orders', 'liquidation-warning']

const topics = []
for (const instId in insts) {
	const channel = 'candle' + insts[instId].bar
	const instType = instId.substring(instId.lastIndexOf('-') + 1)
	topics.push({
		channel,
		instId,
	})
	handlers.set(channel, onTick)
	for (const channel of channels) {
		topics.push({
			channel,
			instType,
			instId,
		})
	}
}

const klines = new Map

export async function start() {
	for (const instId in insts) {
		const candles = await client.getMarkPriceCandles(instId, insts[instId].bar, { limit: 28 })
		klines.set(instId, candles.reverse())
	}
	wsc.subscribe(topics)
}

const isLive = order => order.state == 'live' || order.state == 'partially_filled'

let ordId = '',
//lastTime,
signal = ''

export function getSignal(kline) {
	const ema3 = getEMA(kline, 3),
		ema6 = getEMA(kline, 6)
	return ema3 > ema6 ? 'buy' : ema3 < ema6 ? 'sell' : ''
}

export function popSignal() {
	const s = signal
	signal = ''
	return s
}

export function setSignal(s) {
	signal = s
}

function onTick({ arg, data }) {
	data = data.filter(c => c[5] == '1')
	const symbol = arg.instId

	function tryCancel(order, side) {
		if (order.instId == symbol && isLive(order) && order.side == side) {
			return cancelOrder(symbol, ordId)
		}
	}

	const kline = klines.get(symbol)
	kline.push(...data.filter(c => c[5] == '1'))
	while (kline.length > 28)
		kline.shift()
	if (ordId == 'unknown')
		return
	const order = orders.get(ordId)
	if (order?.state == 'filled') {
		ordId = ''
	}
	const latest = kline[kline.length - 1]
	//if (latest[0] - lastTime < 30 * 1000)
	//	return
	//lastTime = latest[0]
	const signal = popSignal(kline)
	const k = 0.0015
	if (signal == 'buy') {
		if (order) {
			const c = tryCancel(order, 'sell')
			if (c)
				return c
		}
		if ((positions.get(symbol)?.pos || 0) <= 0)
			return trade(symbol, 'buy', latest[3] * (1 - k)).catch(err => {
				console.error(err)
			})
	} else if (signal == 'sell') {
		if (order) {
			const c = tryCancel(order, 'buy')
			if (c)
				return c
		}

		if ((positions.get(symbol)?.pos || 0) >= 0)
			return trade(symbol, 'sell', latest[2] * (1 + k)).catch(err => {
				console.error(err)
			})
	}
}

async function trade(symbol, side, price) {
	ordId = 'unknown'
	const { quantity, tp, sl } = insts[symbol]
	const r = await (side == 'buy' ? buy : sell)(symbol, quantity, price, tp, sl)
	if (r.code == '0') {
		ordId = r.data.ordId
		console.log('order', ordId)
	}
	return r
}