<script lang="ts">
	let canvas: HTMLCanvasElement;
	let audioContext: AudioContext;
	let decibels = 0;
	let averageDecibels = 0;
	let canvasCtx: CanvasRenderingContext2D | null;

	let clientWidth = 800;
	let canvasWidth = clientWidth * 0.95;
	let canvasHeight = 300;

	const maxLength = 1000; // 设置数组的最大长度
	const array: number[] = [];

	let started = false;

	function addToBuffer(item: number) {
		if (item < 0) return; // 如果item为负数，直接返回
		array.push(item); // 将元素添加到数组末尾
		if (array.length > maxLength) {
			array.shift(); // 移除数组的第一个元素，保持数组长度不超过最大长度
		}
	}
	function calculateAverageDecibels(decibelsArray: number[]) {
		if (decibelsArray.length === 0) return 0;
		const sum = decibelsArray.reduce((total, decibels) => total + decibels, 0);
		return Number((sum / decibelsArray.length).toFixed(0));
	}

	async function startTest() {
		canvasCtx = canvas.getContext('2d');
		audioContext = new AudioContext();
		let stream = await navigator.mediaDevices.getUserMedia({ audio: true });

		// 创建音频输入节点
		const audioInput = audioContext.createMediaStreamSource(stream);
		// 创建分析器节点
		const analyser = audioContext.createAnalyser();
		analyser.fftSize = 2048;
		// 连接音频输入节点和分析器节点
		audioInput.connect(analyser);

		// 定义更新函数，用于获取分贝级别并进行绘制和显示
		function update() {
			// 创建数据数组来保存分析结果
			const bufferLength = analyser.frequencyBinCount;
			const dataArray = new Float32Array(bufferLength);
			// 获取频域数据
			analyser.getFloatTimeDomainData(dataArray);
			// 计算平均分贝值
			const total = dataArray.reduce((acc, val) => acc + val * val, 0);
			const rms = Math.sqrt(total / bufferLength);
			// 根据麦克风灵敏度和参考电平计算dBSPL
			const microphoneSensitivity = 0; // 你需要使用正确的麦克风灵敏度值
			const referenceLevel = 0.00002; // 参考电平为 0.00002 Pascal
			let dB_HL = 20 * Math.log10(rms / referenceLevel) + microphoneSensitivity;

			// Convert dB SPL to dB HL
			// dB HL = 0.75 * dB SPL + 19
			// dB SPL = 1.33 * dB HL - 25.33
			decibels = Number((0.75 * dB_HL + 19).toFixed(0));
			// 更新分贝值
			addToBuffer(decibels);
			averageDecibels = calculateAverageDecibels(array);

			// 绘制函数
			function draw() {
				// 获取音频数据
				analyser.getFloatFrequencyData(dataArray);
				if (!canvasCtx) return;
				// 清除画布
				canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);
				// 设置样式
				canvasCtx.fillStyle = 'rgb(200, 0, 0)';
				// 绘制频谱条
				const barWidth = canvasWidth / bufferLength;
				let x = 0;
				for (let i = 0; i < bufferLength; i++) {
					const barHeight = ((dataArray[i] + 140) * canvasHeight) / 140; // 映射数据到画布高度
					canvasCtx.fillRect(x, canvasHeight - barHeight, barWidth, barHeight);
					x += barWidth;
				}
			}
			draw();
			requestAnimationFrame(update);
		}
		update();
	}

	function stopTest() {
		decibels = 0;
		audioContext.suspend();
	}

	function handleBtnClick() {
		if (!started) {
			startTest();
			started = true;
		} else {
			stopTest();
			started = false;
		}
	}
</script>

<main class="text-center mt-10" bind:clientWidth>
	<h1 class="text-4xl mb-5">分贝测试</h1>
	<p>当前分贝数：{decibels} dB</p>

	<p>平均分贝：{averageDecibels} dB</p>

	<canvas bind:this={canvas} width={canvasWidth} height={canvasHeight} class="mx-auto mb-5" />

	<button class="btn btn-primary" on:click={handleBtnClick}> {started ? '停止' : '开始'}</button>
</main>
