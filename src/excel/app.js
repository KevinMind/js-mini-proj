console.log('Hello!');

/*
1. UI should include load/save buttons calling the load_data and save_data functions.
2. implement state machine for current excel sheet data model. Should:
- keep track of the dimensions of the table, column count, row count.
- keep a state object to save data saved per row per column.
- implement methods for modifying state. start with single cell.
3. Implement UI controller for rendering cell state to the UI elements, should include mapping for selecting a cell to edit, and change handlers to update the state while typing.

*/

const DEFAULT_COLUMN_COUNT = 8;

class Sheet {
    constructor() {
        this.columnCount = DEFAULT_COLUMN_COUNT;
        this.rowCount = DEFAULT_COLUMN_COUNT;

        this.clear();
    }

    setCell(row, column, value) {
        if (row < this.data.length && column < this.columnCount) {
            this.data[row][column] = value;
        } else {
            console.error("INVALID CELL", {row, column, value, data: this.data});
        }
    }

    clear(from, to) {
        if (!from && !to) {
            this.data = Array(this.columnCount).fill(null).map(() => Array(this.rowCount).fill(null));
        } else {
            for (let x = from[0]; x <= to[0]; x++) {
                for (let y = from[1]; y <= to[1]; y++) {
                    this.data[x][y] = null;
                }
            }
        }
        
    }
}

class Cell {
    constructor({
        onChange = () => {},
        onFocus = () => {},
        onBlur = () => {},
        onMouseDown = () => {},
        onMouseUp = () => {},
        value = null,
    }) {
        this.onChange = onChange;
        this.onFocus = onFocus;
        this.onBlur = onBlur;

        this.el = document.createElement('td');
        this.el.onmousedown = onMouseDown;
        this.el.onmouseup = onMouseUp;

        this.render({value});
    }

    render({value = null, editting = false, selected = false} = {value: null, editting: false, selected: false}) {
        this.el.innerHTML = '';

        if (selected) {
            this.el.classList.add('selected');
        } else {
            this.el.classList.remove('selected');
        }

        if (editting) {
            const input = document.createElement('input');
            input.onkeyup = (e) => this.onChange(e.target.value);
            input.onblur = () => this.onBlur();
            input.value = value;
            this.el.appendChild(input);
            input.focus();
        } else {
            const text = document.createElement('div');
            text.innerText = value;
            this.el.appendChild(text);
        }
    }
}

class Form {
    constructor({
        onSave = () => {},
        onLoad = () => {},
    }) {
        this.el = document.createElement('div');
        this.onSave = onSave;
        this.onLoad = onLoad;

        this.el.classList.add('controller');

        this.mount();
    }

    mount() {
        const dataKey = document.createElement('input');
        dataKey.type = "text";
        dataKey.placeholder = "Enter a key to save/load data";

        const saveButton = document.createElement('button');
        saveButton.innerText = "Save";
        saveButton.onclick = () => {
            this.onSave();
            dataKey.value = "";
        }

        const loadButton = document.createElement('button');
        loadButton.innerText = "Load";
        loadButton.onclick = () => {
            this.onLoad(dataKey.value);
            dataKey.value = "";
        }

        this.el.appendChild(dataKey);
        this.el.appendChild(saveButton);
        this.el.appendChild(loadButton);
    }
}

class Controller {
    constructor(node, sheet = new Sheet()) {
        if (!node) throw new Error("Must provide root node to mount on");

        this.sheet = sheet;
        this.cells = Array(this.sheet.rowCount).fill(null).map(() => Array(this.sheet.columnCount).fill(null));
        this.root = node;
        this.keyupListener = null;
        this.dragging = false;
        this.downSelected = null;
        this.upSelected = null;

        this.mount();
    }

    selectCell(row, column) {
        let newRow = this.downSelected[0];
        let newColumn = this.downSelected[1];

        if (row >= 0 && row < this.sheet.rowCount) newRow = row;
        if (column >= 0 && column < this.sheet.columnCount) newColumn = column;

        this.downSelected = [newRow, newColumn];
        this.upSelected = [newRow, newColumn];
    }

    mount() {
        this.root.innerHTML = '';
        this.keyupListener && this.root.removeEventListener('keyup', this.keyupListener);

        const table = document.createElement('table');
        const tbody = document.createElement('tbody');

        for (let x = 0; x < this.sheet.rowCount; x++) {
            const trow = document.createElement('tr');

            for (let y = 0; y < this.sheet.columnCount; y++) {
                const cellComp = new Cell({
                    value: this.sheet.data[x][y],
                    onChange: (value) => {
                        this.sheet.setCell(x, y, value);
                    },
                    onfocus: () => {
                        this.selectCell(x, y);
                        this.render();
                    },
                    onMouseDown: () => {
                        console.log('mousedown', {x, y});
                        this.downSelected = [x, y];
                        this.upSelected = [x, y];
                        this.dragging = true;
                        this.render();
                    },
                    onMouseUp: () => {
                        console.log('mouseup', {x, y});
                        this.upSelected = [x, y];
                        this.dragging = false;
                        this.render();
                    }
                });

                this.cells[x][y] = cellComp;

                trow.appendChild(cellComp.el);
            }

            tbody.appendChild(trow);
        }

        table.appendChild(tbody);

        const form = new Form({
            onSave: () => {
                console.log("saving", this.sheet.data);
            },
            onLoad: (key) => {
                console.log('loading', key);
                this.sheet.clear();
            },
        })

        this.root.appendChild(form.el);
        this.root.appendChild(table);

        this.keyupListener = this.root.addEventListener('keyup', (e) => {
            if (e.key.startsWith("Arrow")) {
                switch (e.key) {
                    case "ArrowUp":
                        this.selectCell(this.downSelected[0] - 1, this.downSelected[1]);
                        break;
                    case "ArrowDown":
                        this.selectCell(this.downSelected[0] + 1, this.downSelected[1]);
                        break;
                    case "ArrowLeft":
                        this.selectCell(this.downSelected[0], this.downSelected[1] - 1);
                        break;
                    case "ArrowRight":
                        this.selectCell(this.downSelected[0], this.downSelected[1] + 1);
                        break;
                    default:
                        break;
                }
                this.render();
            } else if (e.key === "Backspace") {
                this.sheet.clear(this.downSelected, this.upSelected);
                this.render();
            }
        });

        this.render();
    }

    render() {
        for (let x = 0; x < this.sheet.rowCount; x++) {
            for (let y = 0; y < this.sheet.columnCount; y++) {
                const cellCmp = this.cells[x][y];

                if (!cellCmp) throw new Error("Missing cell component");

                if (cellCmp.value === this.sheet.data[x][y]) continue;

                const renderProps = {
                    value: this.sheet.data[x][y],
                    editting: false,
                    selected: false,
                }

                if (x >= this.downSelected[0] && x <= this.upSelected[0] && y >= this.downSelected[1] && y <= this.upSelected[1]) {
                    renderProps.selected = true;
                }

                if (x === this.downSelected[0] && y === this.downSelected[1]) {
                    renderProps.editting = true;
                }

                cellCmp.render(renderProps);
            }
        }

    }
}

const table = new Sheet();
const root = document.getElementById('root');

const controller = new Controller(root, table);

controller.selectCell(2, 0);
controller.selectCell(12, 0);