/**
 * @param description Technical Indicators
 */

// moving average (MA)
export function getMA(data) {
	const sum = data.reduce((prev, current) =>
		prev + Number(current[4]), 0)
	return sum / data.length
}

// exponential moving average (EMA)
export function getEMA(data, n = 6) {
	const emaList = []
	for (let i = 0; i < data.length; i++) {
		if (i == 0) {
			emaList.push(data[i][4])
		} else {
			emaList.push(emaList[i - 1] * (n - 1) / (n + 1) + data[i][4] * 2 / (n + 1))
		}
	}
	return emaList.pop()
}

export function getMACD(data, n = 12, m = 26, p = 9) {
	const ema12 = getEMA(data.slice(-n))
	const ema26 = getEMA(data.slice(-m))
	const diff = ema12 - ema26
	const dea = getEMA(data.slice(-p))
	const macd = 2 * (diff - dea)
	return { diff, dea, macd }
}
