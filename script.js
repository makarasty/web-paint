/** @typedef {(event: MouseEvent) => any} CoolToolFunction */

const softData =  /**@type {HTMLElement}*/(document.getElementById("softData"))

class CoolTool {
	/**
	 * @param {string} name
	 * @param {CoolToolFunction} func
	 */
	constructor(name, func) {
		this.name = name;
		this.func = func;
	}
}

class CoolToolsManager {
	constructor() {
		this.tools = new Map();
	}

	/**
	 * @param {string} name
	 * @param {CoolToolFunction} func
	 */
	addTool(name, func) {
		this.tools.set(name, new CoolTool(name, func));
	}

	/**
	 * @param {string} name
	 */
	getTool(name) {
		return this.tools.get(name);
	}
}

class CanvasManager {
	/**
	 * @param {HTMLCanvasElement} canvas
	 */
	constructor(canvas) {
		/**
		 * @type {canvas}
		 */
		this.canvas = canvas;

		this.ctx = /**@type {CanvasRenderingContext2D}*/(canvas.getContext("2d"));

		/**
		 * @type {boolean}
		 */
		this.isDrawing = false;

		/**
		 * @type {number}
		 */
		this.brushWidth = 5;

		/**
		 * @type {string}
		 */
		this.selectedTool = "brush";

		/**
		 * @type {string}
		 */
		this.selectedColor = "#000000";

		/**
		 * @type {ImageData[]}
		 */
		this.history = [];

		/**
		 * @type {number}
		 */
		this.historyStep = -1;

		/**
		 * @type {number}
		 */
		this.prevMouseX = 0;

		/**
		 * @type {number}
		 */
		this.prevMouseY = 0;

		/**
		 * @type {ImageData}
		 */
		this.snapshot;

		/**
		 * @type {number}
		 */
		this.pmX = 0;

		/**
		 * @type {number}
		 */
		this.pmY = 0;

		/**
		 * @type {CoolToolsManager}
		 */
		this.toolsManager = new CoolToolsManager();

		this.init();
	}

	init() {
		this.canvas.width = this.canvas.offsetWidth;
		this.canvas.height = this.canvas.offsetHeight;
		this.setCanvasBackground();
		this.addHistory();

		this.canvas.addEventListener("mousedown", (e) => this.startDraw(e));
		this.canvas.addEventListener("mousemove", (e) => this.drawing(e));
		this.canvas.addEventListener("mouseup", () => this.stopDraw());

		document.addEventListener("keydown", (e) => this.handleKeyDown(e));

		window.addEventListener('resize', () => this.resizeCanvas());
	}

	setCanvasBackground() {
		this.ctx.fillStyle = "#fff";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.fillStyle = this.selectedColor;
	}

	addHistory() {
		this.history = this.history.slice(0, this.historyStep + 1);
		this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
		this.historyStep++;
	}

	/**
	 * @param {KeyboardEvent} e
	 */
	handleKeyDown(e) {
		if (e.key === "z") {
			e.preventDefault();
			this.undo();
		} else if (e.key === "u") {
			e.preventDefault();
			this.redo();
		}
	}

	undo() {
		if (this.historyStep > 0) {
			this.historyStep--;
			this.ctx.putImageData(this.history[this.historyStep], 0, 0);
		}
	}

	redo() {
		if (this.historyStep < this.history.length - 1) {
			this.historyStep++;
			this.ctx.putImageData(this.history[this.historyStep], 0, 0);
		}
	}

	/**
	 * @param {MouseEvent} e
	 */
	startDraw(e) {
		this.isDrawing = true;
		this.prevMouseX = e.offsetX;
		this.prevMouseY = e.offsetY;
		this.ctx.beginPath();
		this.ctx.lineWidth = this.brushWidth;
		this.ctx.strokeStyle = this.selectedColor;
		this.ctx.fillStyle = this.selectedColor;
		this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
	}

	stopDraw() {
		if (this.isDrawing) {
			this.addHistory();
			this.isDrawing = false;
		}
	}

	/**
	 * @param {MouseEvent} e
	 */
	drawing(e) {
		if (this.isDrawing) {
			this.ctx.putImageData(this.snapshot, 0, 0);

			const tool = this.toolsManager.getTool(this.selectedTool);
			if (tool) {
				tool.func(e);
			}
		}

		softData.innerHTML = `X: ${e.offsetX}, Y: ${e.offsetY}`;
	}

	resizeCanvas() {
		// xd
	}
}

class UIManager {
	/**
	 * @param {CanvasManager} canvasManager
	 */
	constructor(canvasManager) {
		/**
		 * @type {CanvasManager}
		 */
		this.canvasManager = canvasManager;

		this.fillColor = /**@type {HTMLInputElement}*/(document.querySelector("#fill-color"))
		this.sizeSlider = /**@type {HTMLInputElement}*/(document.querySelector("#size-slider"))
		this.colorPicker = /**@type {HTMLInputElement}*/(document.querySelector("#color-picker"))
		this.clearCanvas = /**@type {HTMLButtonElement}*/(document.querySelector(".clear-canvas"))
		this.saveImg = /**@type {HTMLButtonElement}*/(document.querySelector(".save-img"))
		this.undoBtn = /**@type {HTMLButtonElement}*/(document.querySelector(".undo"))
		this.redoBtn = /**@type {HTMLButtonElement}*/(document.querySelector(".redo"))

		this.colorPicker.value = '#000000'
		this.sizeSlider.value = '5'

		this.undoBtn.disabled = true
		this.redoBtn.disabled = true

		this.init();
	}
	init() {
		this.canvasManager.canvas.addEventListener("mouseup", () => {
			if (this.canvasManager.historyStep > 0) {
				this.undoBtn.disabled = false
			}
		});

		this.sizeSlider.addEventListener("change", () => {
			this.canvasManager.brushWidth = Number(this.sizeSlider.value);
		});

		this.colorPicker.addEventListener("change", () => {
			this.canvasManager.selectedColor = this.colorPicker.value;
		});

		this.clearCanvas.addEventListener("click", () => {
			this.canvasManager.ctx.clearRect(0, 0, this.canvasManager.canvas.width, this.canvasManager.canvas.height);
			this.canvasManager.setCanvasBackground();
			this.canvasManager.addHistory();
		});

		this.saveImg.addEventListener("click", () => {
			const link = document.createElement("a");
			link.download = `${Date.now()}.jpg`;
			link.href = this.canvasManager.canvas.toDataURL();
			link.click();
		});

		this.undoBtn.addEventListener("click", () => {
			this.undoBtn.disabled = this.canvasManager.historyStep === 1
			this.redoBtn.disabled = false
			this.canvasManager.undo()
		});

		this.redoBtn.addEventListener("click", () => {
			this.redoBtn.disabled = !(this.canvasManager.historyStep + 1 < this.canvasManager.history.length - 1)
			this.undoBtn.disabled = false
			this.canvasManager.redo()
		});

		this.loadTools();
	}

	loadTools() {
		const toolButtons = document.querySelectorAll(".tool");

		toolButtons.forEach((btn) => {
			btn.addEventListener("click", () => {
				document.querySelector(".options .active")?.classList.remove("active");
				btn.classList.add("active");
				this.canvasManager.selectedTool = btn.id;
			});
		});
	}
}

window.addEventListener("load", () => {
	const canvas = /**@type {HTMLCanvasElement}*/(document.querySelector("canvas"))
	const canvasMan = new CanvasManager(canvas);
	const uiMan = new UIManager(canvasMan);

	canvasMan.toolsManager.addTool("eraser", (e) => {
		canvasMan.ctx.lineCap = "round";
		canvasMan.ctx.lineJoin = "round";
		canvasMan.ctx.strokeStyle = "#fff";
		canvasMan.ctx.lineTo(e.offsetX, e.offsetY);
		canvasMan.ctx.stroke();
	});

	canvasMan.toolsManager.addTool("line", (e) => {
		let shiftPressed = e.shiftKey;
		let newX = e.offsetX;
		let newY = e.offsetY;

		if (shiftPressed) {
			let deltaX = newX - canvasMan.prevMouseX;
			let deltaY = newY - canvasMan.prevMouseY;

			if (Math.abs(deltaX) > Math.abs(deltaY)) {
				newY = canvasMan.prevMouseY;
			} else {
				newX = canvasMan.prevMouseX;
			}
		}

		canvasMan.ctx.beginPath();
		canvasMan.ctx.moveTo(canvasMan.prevMouseX, canvasMan.prevMouseY);
		canvasMan.ctx.lineTo(newX, newY);
		canvasMan.ctx.stroke();
	});

	canvasMan.toolsManager.addTool("brush", (e) => {
		canvasMan.ctx.lineCap = "square";
		canvasMan.ctx.lineJoin = "bevel";
		canvasMan.ctx.lineTo(e.offsetX, e.offsetY);
		canvasMan.ctx.stroke();
	});

	canvasMan.toolsManager.addTool("rectangle", (e) => {
		canvasMan.ctx.lineCap = "butt";
		canvasMan.ctx.lineJoin = "miter";

		if (!uiMan.fillColor.checked) {
			return canvasMan.ctx.strokeRect(e.offsetX, e.offsetY, canvasMan.prevMouseX - e.offsetX, canvasMan.prevMouseY - e.offsetY);
		}
		canvasMan.ctx.fillRect(e.offsetX, e.offsetY, canvasMan.prevMouseX - e.offsetX, canvasMan.prevMouseY - e.offsetY);
	});

	canvasMan.toolsManager.addTool("circle", (e) => {
		canvasMan.ctx.lineCap = "butt";
		canvasMan.ctx.lineJoin = "miter";

		canvasMan.ctx.beginPath();
		let radiusX = Math.abs(canvasMan.prevMouseX - e.offsetX);
		let radiusY = Math.abs(canvasMan.prevMouseY - e.offsetY);
		canvasMan.ctx.ellipse(canvasMan.prevMouseX, canvasMan.prevMouseY, radiusX, radiusY, 0, 0, 2 * Math.PI);
		uiMan.fillColor.checked ? canvasMan.ctx.fill() : canvasMan.ctx.stroke();
	});

	canvasMan.toolsManager.addTool("triangle", (e) => {
		canvasMan.ctx.lineCap = "butt";
		canvasMan.ctx.lineJoin = "miter";

		canvasMan.ctx.beginPath();
		canvasMan.ctx.moveTo(canvasMan.prevMouseX, canvasMan.prevMouseY);
		canvasMan.ctx.lineTo(e.offsetX, e.offsetY);
		canvasMan.ctx.lineTo(canvasMan.prevMouseX * 2 - e.offsetX, e.offsetY);
		canvasMan.ctx.closePath();
		uiMan.fillColor.checked ? canvasMan.ctx.fill() : canvasMan.ctx.stroke();
	});

	canvasMan.toolsManager.addTool("pencil", (e) => {
		canvasMan.ctx.lineCap = "round";
		canvasMan.ctx.lineJoin = "round";
		canvasMan.ctx.lineTo(e.offsetX, e.offsetY);
		canvasMan.ctx.stroke();
	});

	canvasMan.toolsManager.addTool("spray", (e) => {
		canvasMan.ctx.lineCap = "round";
		canvasMan.ctx.lineJoin = "miter";

		let spraySize = 2;
		let sprayRadius = canvasMan.brushWidth * 4;
		canvasMan.ctx.lineWidth = spraySize;

		for (let index = 0; index < 5; index++) {
			const sprayX = canvasMan.prevMouseX + Math.random() * sprayRadius - sprayRadius / 2;
			const sprayY = canvasMan.prevMouseY + Math.random() * sprayRadius - sprayRadius / 2;
			canvasMan.ctx.moveTo(sprayX, sprayY);
			canvasMan.ctx.arcTo(sprayX, sprayY, spraySize, 0, 2 * Math.PI);
		}

		canvasMan.ctx.fillStyle = canvasMan.selectedColor;
		canvasMan.ctx.stroke();

		canvasMan.prevMouseX = e.offsetX;
		canvasMan.prevMouseY = e.offsetY;
	});
});