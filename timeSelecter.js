// echarts 5.0以上版本显示有问题，目前只能使用4.0版

const timeSelecter = {}
timeSelecter.init = function(echarts, dom, cb) {
	if (!echarts.zrender) {
		console.error('请传入正确的eharts')
		return
	}

	dom.style.backgroundColor = '#fff'
	const zr = echarts.zrender.init(dom)
	let w = zr.getWidth()
	let h = zr.getHeight()

	let rectWidth = w / 28
	let rectHeight = h / 9.25
	let allRect = {}
	let selectedRect = []
	let nameIndex = 1
	let positionX = w / 7
	let positionY = h / 6.17

	// 生成时间段单元格
	for (let i = 1; i < 8; i++) {
		for (let j = 1; j < 25; j++) {
			addRect((j - 1) * rectWidth + positionX, (i - 1) * rectHeight + positionY)
			nameIndex++
		}
	}

	// 生成表头等
	let p1 = w - positionX
	let timeArr = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11',
		'12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'
	]
	let dayArr = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']
	addRect(0, 0, '星期 / 时间', positionX, positionY)
	addRect(positionX, 0, '00:00 - 12:00', p1 / 2, positionY / 2)
	addRect(positionX + p1 / 2, 0, '12:00 - 24:00', p1 / 2, positionY / 2)
	for (let i = 0; i < 24; i++) {
		addRect(p1 / 24 * i + positionX, positionY / 2, timeArr[i], p1 / 24, positionY / 2)
	}
	for (let i = 0; i < 7; i++) {
		addRect(0, rectHeight * i + positionY, dayArr[i], positionX, rectHeight)
	}
	addRect(0, rectHeight * 7 + positionY, '清空', w, h - rectHeight * 7 - positionY, ()=> {
		selectedRect = []
		changeColor()
		cb(selectedRect)
	})

	// 鼠标事件
	let startX
	let startY
	let kuang
	let mouseDown = false
	let startRect
	zr.on('mousedown', (e) => {
		if (e.target.name > 168) { // 出圈了
			mouseDown = false
			return
		}
		mouseDown = true
		// console.log(e.target.name)
		if (e.target.name) {
			startRect = e.target.name
		}
		startX = e.offsetX
		startY = e.offsetY
		kuang = new echarts.graphic.Rect({
			shape: {
				x: startX,
				y: startY,
				width: 0,
				height: 0,
			},
			style: {
				fill: '#00aaff',
				opacity: 1
			},
			zlevel: -1 //不放到下层,up事件的target是kuang
		})
		zr.add(kuang)
	})

	zr.on('mouseup', (e) => {
		if (!mouseDown) return
		if (!e.target || e.target.name > 168) { //出圈了
			zr.remove(kuang)
			return
		}
		mouseDown = false
		zr.remove(kuang)

		let start = Math.min(startRect, e.target.name)
		let end = Math.max(startRect, e.target.name)
		// 注意边界问题
		let rowStart = Math.floor((start - 1) / 24)
		let rowEnd = Math.floor((end - 1) / 24)
		let a = start % 24 || 24
		let b = end % 24 || 24
		let colStart = Math.min(a, b)
		let colEnd = Math.max(a, b)
		// console.log(rowStart,rowEnd,colStart,colEnd )

		let curArr = []
		for (let i = rowStart; i <= rowEnd; i++) {
			for (let j = colStart; j <= colEnd; j++) {
				curArr.push(i * 24 + j)
			}
		}

		// 此处逻辑较复杂
		if (!selectedRect.length) {
			//第一次选
			selectedRect = curArr
		} else {
			//先判断是否有交集
			let jiaoji = arrJiaoji(selectedRect, curArr)
			if (!jiaoji.length) {
				// 没有交集则合并
				selectedRect = [...selectedRect, ...curArr]
			} else {
				//判断交集长度是否跟arr的长度一致
				if (jiaoji.length !== curArr.length) {
					// 不一致，合并并去重
					selectedRect = [...selectedRect, ...curArr]
					selectedRect = Array.from(new Set(selectedRect))
				} else {
					//如果一致，说明是selectedRect的子集，则从selectedRect中去除
					selectedRect = arrChaji(selectedRect, curArr)
				}
			}
		}
		// 改变颜色
		changeColor()

		// 打印选择的方块
		// console.log(selectedRect)
		cb(selectedRect)
	})

	zr.on('mousemove', (e) => {
		if (mouseDown) {
			let width = e.offsetX - startX
			let height = e.offsetY - startY
			kuang.attr({
				shape: {
					width: width,
					height: height,
				}
			})
		}
	})

	//改变颜色
	function changeColor() {
		for (let i in allRect) {
			allRect[i].attr({
				style: {
					fill: '#fff',
				}
			})
		}
		selectedRect.forEach(v => {
			allRect[v].attr({
				style: {
					fill: '#00aaff',
				}
			})
		})
	}

	// 数组交集
	function arrJiaoji(arr1, arr2) {
		let arr = arr1.filter((v) => {
			return arr2.indexOf(v) !== -1
		})
		return arr
	}

	// 数组差集
	function arrChaji(arr1, arr2) {
		let arr = arr1.filter((v) => {
			return arr2.indexOf(v) === -1
		})
		return arr
	}

	// 创建方块
	function addRect(x, y, text, width, height, click) {
		const rect = new echarts.graphic.Rect({
			name: nameIndex,
			shape: {
				x: x,
				y: y,
				width: width || rectWidth,
				height: height || rectHeight,
			},
			style: {
				fill: '#fff',
				opacity: 0.6,
				text: text || '',
				stroke: '#c6c6c6'
			},
			cursor: click ? 'pointer' : 'default',
			onclick: click
		})
		allRect[nameIndex] = rect
		zr.add(rect)
	}
}

export default timeSelecter
