class DbsplMeter extends AudioWorkletProcessor {
	constructor() {
		super();

		this.volumeSum = 0;
		this.volumeCount = 0;

		this.port.onmessage = (event) => {
			if (event.data === 'reset') {
				this.volumeSum = 0;
				this.volumeCount = 0;
			}
		};
	}

	process(inputs, outputs, parameters) {
		const input = inputs[0];
		const channel = input[0];
		const length = channel.length;

		let sumOfSquares = 0;

		for (let i = 0; i < length; i++) {
			const sample = channel[i];
			sumOfSquares += sample * sample;
			// sumOfSquares += Math.abs(sample);
		}

		const rms = Math.sqrt(sumOfSquares / (length / 2));
		const amplitude = Math.abs(rms);

		// 根据麦克风灵敏度和参考电平计算dBSPL
		const microphoneSensitivity = 1; // 你需要使用正确的麦克风灵敏度值
		const referenceLevel = 0.00002; // 参考电平为 0.00002 Pascal
		let dbspl = 20 * Math.log10(amplitude / referenceLevel) + microphoneSensitivity;
		dbspl = 0.75 * dbspl + 19;

		// 将dBSPL值发送到主线程
		this.port.postMessage(dbspl);

		return true;
	}
}

registerProcessor('dbspl-meter', DbsplMeter);
