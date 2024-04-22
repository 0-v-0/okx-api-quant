import { client } from '../clients/okx.js'
import { insts } from '../config.js'
import { getSignal } from '../services/strategy.js'

export function backtest(data) {
	const result = []
	const klines = data.slice(0, 28)
	for (const kline of data) {
		klines.push(kline)
		if (klines.length > 28)
			klines.shift()
		const signal = getSignal(klines)
		if (signal) {
			result.push({
				side: signal,
				price: kline[4],
				time: kline[0]
			})
		}
	}
	return result
}

export function getProfit(ops, price) {
	let profit = 0, pos = 0
	for (const op of ops) {
		if (op.side == 'buy') {
			profit -= +op.price
			pos++
		} else {
			profit += +op.price
			pos--
		}
	}
	return profit + pos * price
}

export async function run() {
	for (const instId in insts) {
		const candles = await client.getMarkPriceCandles(instId, insts[instId].bar, { limit: 150 })
		const price = candles[0][4]
		candles.reverse()
		const data = backtest(candles)
		console.log(data)
		const profit = getProfit(data, price) * insts[instId].quantity
		console.log(instId, profit)
	}
}
