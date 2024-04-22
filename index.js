import { connect } from './clients/okx.js'
import { start, setSignal } from './services/strategy.js'
import 'dotenv/config'
import readline from 'readline'
//import { run } from './utils/backtest.js'

process.stdin.setEncoding('utf8')
async function quantStart() {
	console.log('\nstrategy launch', new Date().toLocaleString())
	await connect()
	await start()
	//await run()
	readline.createInterface({
		input: process.stdin,
		output: process.stdout
	}).on('line', line => {
		line = line.trimEnd()
		if (line == '1')
			setSignal('buy')
		else if (line == '2')
			setSignal('sell')
		else
			setSignal('')
	})
}

function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

quantStart().catch(err => console.error(err))
