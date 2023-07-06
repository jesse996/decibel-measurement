<script lang="ts">
	let decibels = 0;

	let audioContext: AudioContext;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null;
	let w;
	let h;

	const maxLength = 100; // 设置数组的最大长度
	const array: number[] = [];

	function addToBuffer(item: number) {
		array.push(item); // 将元素添加到数组末尾

		if (array.length > maxLength) {
			array.shift(); // 移除数组的第一个元素，保持数组长度不超过最大长度
		}
	}
	function calculateAverageDecibels(decibelsArray: number[]) {
		const sum = decibelsArray.reduce((total, decibels) => total + decibels, 0);
		let average = Number((sum / decibelsArray.length).toFixed(0));

		return average;
	}
	let averageDecibels = 0;

	function startTest() {
		ctx = canvas.getContext('2d');

		audioContext = new AudioContext();
		navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then((stream) => {
				// 创建音频输入节点
				const audioInput = audioContext.createMediaStreamSource(stream);

				// 创建分析器节点
				const analyser = audioContext.createAnalyser();
				analyser.fftSize = 2048;

				// 连接音频输入节点和分析器节点
				audioInput.connect(analyser);

				// 创建数据数组来保存分析结果
				const bufferLength = analyser.frequencyBinCount;
				const dataArray = new Uint8Array(bufferLength);

				// 定义更新函数，用于获取分贝级别并进行绘制和显示
				function update() {
					// 获取频域数据
					analyser.getByteFrequencyData(dataArray);

					// 清除画布
					ctx!.clearRect(0, 0, canvas.width, canvas.height);

					// 绘制柱状图
					const barWidth = canvas.width / bufferLength;
					let x = 0;

					for (let i = 0; i < bufferLength; i++) {
						const barHeight = dataArray[i] / 2;

						ctx!.fillStyle = 'rgb(' + (barHeight + 100) + ', 50, 50)';
						ctx!.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

						x += barWidth + 1;
					}

					// 计算平均分贝值
					const total = dataArray.reduce((acc, val) => acc + val, 0);
					// const average = total / bufferLength;
					const dB = Math.round(total / bufferLength);

					// 更新分贝值
					decibels = dB;
					addToBuffer(dB);
					averageDecibels = calculateAverageDecibels(array);

					// 递归调用更新函数以获取实时数据并绘制
					requestAnimationFrame(update);
				}

				// 开始更新
				update();
			})
			.catch((err) => {
				console.error('Error accessing microphone:', err);
			});
	}

	function stopTest() {
		decibels = 0;
		audioContext.suspend();
	}
</script>

<main class="text-center mt-10" bind:clientWidth={w} bind:clientHeight={h}>
	<h1 class="text-4xl mb-5">Svelte 分贝测试</h1>
	<p>当前分贝数：{decibels} dB</p>

	<p>平均分贝：{averageDecibels} dB</p>

	<canvas bind:this={canvas} width={w * 0.9} height="300" class="mx-auto" />

	<button class="btn btn-primary" on:click={startTest}>开始测试</button>
	<button class="btn btn-primary" on:click={stopTest}>停止测试</button>
</main>
