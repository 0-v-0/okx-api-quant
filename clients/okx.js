import { market } from '../config.js'
import { DefaultLogger, RestClient, WebsocketClient } from 'okx-api'

/** @type {RestClient} */
export let client,
/** @type {WebsocketClient} */
wsc

export const positions = new Map,
	orders = new Map

/** @type {Map<string, (e: any) => void>} */
export const handlers = new Map

export function connect(logger = DefaultLogger) {
	const account = process.env.API_KEY && {
		apiKey: process.env.API_KEY,
		apiSecret: process.env.API_SECRET,
		apiPass: process.env.API_PASSPHRASE,
	}
	client = new RestClient(account, market, {
		baseUrl: 'https://www.jasjdgh.com'
	}, {
		timeout: 5000
	})
	wsc = new WebsocketClient(
		{
			market,
			accounts: [account]
		}, {

	})
	wsc.logger = logger
	wsc.on('error', (data) =>
		console.error('ws error: ', data)
	)
		.on('update', (e) => {
			const channel = e?.arg?.channel
			if (!channel)
				return
			switch (channel) {
				case 'positions':
					for (const pos of e.data)
						positions.set(pos.instId, pos)
					break
				case 'orders':
					for (const order of e.data) {
						if (order.state == 'filled')
							console.log(order.side, order.instId, order.lever + 'x',
								order.accFillSz + '@' + order.avgPx, 'filled')
						orders.set(order.ordId, order)
					}
					break
				case 'liquidation-warning':
					console.warning('liquidation-warning', data)
					break
				default:
					if (channel.startsWith('candle')) {
						const handler = handlers.get(channel)
						handler?.(e)
					} else
						console.error('unknown channel', e)
			}
		})
		.on('response', (data) => {
			const id = data.id
			if (id) {
				const req = reqs.get(id)
				if (req) {
					req(data)
					reqs.delete(id)
				}
			}
		})
	return wsc.connectPublic()
}

/** @type {Map<number, (e: any) => void>} */
const reqs = new Map

let id = 1

export function send(op, args, timeout = 5000) {
	wsc.tryWsSend('demoPrivate', `{"id":${id},"op":"${op}","args":${JSON.stringify(args)}}`)
	const promise = new Promise((res, rej) => {
		reqs.set(id, res)
		setTimeout(() => {
			const req = reqs.get(id)
			if (req) {
				reqs.delete(id)
				rej('timeout')
			}
		}, timeout)
	})
	id++
	return promise
}
