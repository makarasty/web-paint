const canvas = /** @type {HTMLCanvasElement} */(document.querySelector("canvas"))
const fillColor = /**@type {HTMLInputElement}*/(document.querySelector("#fill-color"))
const sizeSlider = /**@type {HTMLInputElement}*/(document.querySelector("#size-slider"))
const colorPicker = /**@type {HTMLInputElement}*/(document.querySelector("#color-picker"))
const clearCanvas = /**@type {HTMLButtonElement}*/(document.querySelector(".clear-canvas"))
const saveImg = /**@type {HTMLButtonElement}*/(document.querySelector(".save-img"))
const undoBtn = /**@type {HTMLButtonElement}*/(document.querySelector(".undo"))
const redoBtn = /**@type {HTMLButtonElement}*/(document.querySelector(".redo"))

const ctx = /** @type {CanvasRenderingContext2D} */(canvas.getContext("2d"))

/** @typedef {(event: MouseEvent) => any} CoolToolFunction */

class CoolTool {
	/**
	 * @param {string} name
	 * @param {CoolToolFunction} func
	 */
	constructor(name, func) {

		/**
		 * @type {name}
		 */
		this.name = name

		/**
		 * @type {func}
		 */
		this.func = func
	}
}

class CoolToolsManager {

	constructor() {
		/**
		 * @type {Map<string, CoolTool>}
		 */
		this.tools = new Map();
	}

	/**
	 * @param {string} name
	 * @param {CoolToolFunction} func
	 */
	addTool(name, func) {
		this.tools.set(name, new CoolTool(name, func));
	}

	getTools() {
		return this.tools;
	}
}

const toolsManager = new CoolToolsManager();

/**
 * @type {number}
 */
let prevMouseX

/**
 * @type {number}
 */
let prevMouseY

/**
 * @type {ImageData}
 */
let snapshot

let isDrawing = false
let brushWidth = 5
let selectedTool = "brush"
let selectedColor = "#000000"

colorPicker.value = selectedColor
sizeSlider.value = selectedColor

/**
 * @type {ImageData[]}
 */
let history = []
let historyStep = -1

// Functions

function setCanvasBackground() {
	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = selectedColor;
}

function addHistory() {
	history = history.slice(0, historyStep + 1);
	history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
	historyStep++;
}

/**
 * @param {MouseEvent} e
 */
function startDraw(e) {
	isDrawing = true;
	prevMouseX = e.offsetX;
	prevMouseY = e.offsetY;
	ctx.beginPath();
	ctx.lineWidth = brushWidth;
	ctx.strokeStyle = selectedColor;
	ctx.fillStyle = selectedColor;
	snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function stopDraw() {
	if (isDrawing) {
		addHistory();
		isDrawing = false;
	}
}

/**
 * @param {MouseEvent} e
 */
function drawing(e) {
	if (!isDrawing) return;
	ctx.putImageData(snapshot, 0, 0);

	const tools = toolsManager.getTools()

	const thatTool = tools.get(selectedTool)
	thatTool && thatTool.func(e)
}

function loadTools() {
	const toolButtons = /**@type {NodeListOf<HTMLElement>}*/(document.querySelectorAll(".tool"))

	toolButtons.forEach(btn => {
		btn.addEventListener("click", () => {
			document.querySelector(".options .active")?.classList.remove("active");
			btn.classList.add("active");
			selectedTool = btn.id;
		});
	});
}

// Tools

toolsManager.addTool("eraser", (e) => {
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';

	ctx.strokeStyle = "#fff";
	ctx.lineTo(e.offsetX, e.offsetY);
	ctx.stroke();
})

toolsManager.addTool("line", (e) => {
	let shiftPressed = e.shiftKey;
	let newX = e.offsetX;
	let newY = e.offsetY;

	if (shiftPressed) {
		let deltaX = newX - prevMouseX;
		let deltaY = newY - prevMouseY;

		if (Math.abs(deltaX) > Math.abs(deltaY)) {
			newY = prevMouseY;
		} else {
			newX = prevMouseX;
		}
	}

	ctx.beginPath();
	ctx.moveTo(prevMouseX, prevMouseY);
	ctx.lineTo(newX, newY);
	ctx.stroke();
})

toolsManager.addTool("brush", (e) => {
	ctx.lineCap = 'square';
	ctx.lineJoin = 'bevel';

	ctx.lineTo(e.offsetX, e.offsetY);
	ctx.stroke();
})

toolsManager.addTool("rectangle", (e) => {
	ctx.lineCap = "butt";
	ctx.lineJoin = "miter";

	if (!fillColor.checked) {
		return ctx.strokeRect(e.offsetX, e.offsetY, prevMouseX - e.offsetX, prevMouseY - e.offsetY);
	}
	ctx.fillRect(e.offsetX, e.offsetY, prevMouseX - e.offsetX, prevMouseY - e.offsetY);
})

toolsManager.addTool("circle", (e) => {
	ctx.lineCap = "butt";
	ctx.lineJoin = "miter";

	ctx.beginPath();
	let radius = Math.sqrt(Math.pow((prevMouseX - e.offsetX), 2) + Math.pow((prevMouseY - e.offsetY), 2));
	ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
	fillColor.checked ? ctx.fill() : ctx.stroke();
})

toolsManager.addTool("triangle", (e) => {
	ctx.lineCap = "butt";
	ctx.lineJoin = "miter";

	ctx.beginPath();
	ctx.moveTo(prevMouseX, prevMouseY);
	ctx.lineTo(e.offsetX, e.offsetY);
	ctx.lineTo(prevMouseX * 2 - e.offsetX, e.offsetY);
	ctx.closePath();
	fillColor.checked ? ctx.fill() : ctx.stroke();
})

toolsManager.addTool("pencil", (e) => {
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';

	ctx.lineTo(e.offsetX, e.offsetY);
	ctx.stroke();
})

toolsManager.addTool("spray", (e) => {
	ctx.lineCap = "round";
	ctx.lineJoin = "miter";

	let spraySize = 2;
	let sprayRadius = brushWidth * 4

	ctx.lineWidth = spraySize;

	for (let index = 0; index < 5; index++) {
		const sprayX = prevMouseX + Math.random() * sprayRadius - sprayRadius / 2;
		const sprayY = prevMouseY + Math.random() * sprayRadius - sprayRadius / 2;

		ctx.moveTo(sprayX, sprayY);
		ctx.arcTo(sprayX, sprayY, spraySize, 0, 2 * Math.PI);
	}

	ctx.fillStyle = selectedColor;
	ctx.stroke();

	prevMouseX = e.offsetX
	prevMouseY = e.offsetY
})

// Events

document.addEventListener("keydown", (e) => {
	if (e.key === "z") {
		e.preventDefault();
		undoBtn.click();
	} else if (e.key === "u") {
		e.preventDefault();
		redoBtn.click();
	}
});

window.addEventListener("load", () => {
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;
	setCanvasBackground();
	addHistory();
});

sizeSlider.addEventListener("change", () => brushWidth = Number(sizeSlider.value));

colorPicker.addEventListener("change", () => {
	selectedColor = colorPicker.value;
});

clearCanvas.addEventListener("click", () => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	setCanvasBackground();
	addHistory();
});

saveImg.addEventListener("click", () => {
	const link = document.createElement("a");
	link.download = `${Date.now()}.jpg`;
	link.href = canvas.toDataURL();
	link.click();
});

undoBtn.addEventListener("click", () => {
	if (historyStep > 0) {
		historyStep--;
		ctx.putImageData(history[historyStep], 0, 0);
	}
});

redoBtn.addEventListener("click", () => {
	if (historyStep < history.length - 1) {
		historyStep++;
		ctx.putImageData(history[historyStep], 0, 0);
	}
});

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", stopDraw);

loadTools()