
/*
1. renders a chess board and the chess pieces in the correct starting positions.
2. ability to start game by clicking button.
3. randomly choose player 1 or 2 to start.
4. ability to move pieces by clicking on them and then clicking on the square you want to move to.
5. ability to capture pieces by moving to the square they are on.
6. ability to win the game by capturing the king.
7. you cannot move a piece to an invalid position.
8. you cannot move a piece to a square that is occupied by a piece of the same color.
9. you cannot move a piece if it is not your turn.
10. you cannot move a piece if it is not a valid move for that piece.
11. highlight the squares that are valid moves for the piece you have selected.
*/

const colors = ["black", "white"];
const types = ["pawn", "rook", "knight", "bishop", "queen", "king"];
const letters = ["a", "b", "c", "d", "e", "f", "g", "h"];
const initPieces = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];

class Piece {
    constructor(color, type) {
        if (!colors.includes(color) || !types.includes(type)) {
            throw new Error("Invalid piece");
        }
        this.color = color;
        this.type = type;
        this.el = this.mount();
    }

    mount() {
        const el = document.createElement("div");
        el.classList.add("piece", this.color, this.type);

        el.innerHTML = this.type[0].toUpperCase();
        return el;
    }

    possibleMoves(from) {
        let moves = [];
    
        switch(this.type) {
            case 'pawn':
                // Pawns can move one or two squares forward, or one square diagonally forward
                moves = [[0, 1], [0, 2], [1, 1], [-1, 1]];
                break;
            case 'rook':
                // Rooks can move any number of squares along a rank or file
                for(let i = 1; i < 8; i++) {
                    moves.push([i, 0], [-i, 0], [0, i], [0, -i]);
                }
                break;
            case 'knight':
                // Knights can move to any square not on the same rank, file, or diagonal
                moves = [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]];
                break;
            case 'bishop':
                // Bishops can move any number of squares diagonally
                for(let i = 1; i < 8; i++) {
                    moves.push([i, i], [-i, -i], [i, -i], [-i, i]);
                }
                break;
            case 'queen':
                // Queens can move any number of squares along a rank, file, or diagonal
                for(let i = 1; i < 8; i++) {
                    moves.push([i, 0], [-i, 0], [0, i], [0, -i], [i, i], [-i, -i], [i, -i], [-i, i]);
                }
                break;
            case 'king':
                // Kings can move one square in any direction
                moves = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
                break;
        }
    
        // Filter out moves that would go off the board
        moves = moves.filter(move => {
            let [x, y] = [from[0] + move[0], from[1] + move[1]];
            return x >= 0 && x < 8 && y >= 0 && y < 8;
        });

    
        return moves.map((to) => [to[0] + from[0], to[1] + from[1]]);
    }

    render() {
        return this.el;
    }
}

// Need to refactor the datamodel. I would like to model the position of pieces in game. Game has Pieces, which have position as property.
// Then the board can render by reading the state of the game. the game can also provide methods for exposing possible moves for a selected piece. can also update the state which will trigger a re-render of the board.
class Game {
    status = "ready";
    pieces = this.#initPieces();
    active = "black";
    listeners = [];

    constructor() {
        this.#seed();
    }

    #initPieces() {
        return Array.from({length: 8}, () => Array(8).fill(0))
    }

    #seed() {
        initPieces.forEach((type, i) => this.pieces[i][0] = new Piece("black", type));
        Array(8).fill().map((_, i) => this.pieces[i][1] = new Piece("black", "pawn"));
        Array(8).fill().map((_, i) => this.pieces[i][6] = new Piece("white", "pawn"));
        initPieces.reverse().forEach((type, i) => this.pieces[i][7] = new Piece("white", type));
    }

    addListener(listener) {
        this.listeners.push(listener);
    }

    getPiece([x, y]) {
        return this.pieces[x][y];
    }

    move(from, to) {
        const piece = this.getPiece(from);


        if (!piece) {
            console.log('no piece');
            return null;
        }

        if (piece.color !== this.active) {
            console.log('not your turn');
            return null;
        }

        const validMoves = this.possibleMoves(from);
        const isValidMove = validMoves.some((position) => position[0] === to[0] && position[1] === to[1]);

        if (isValidMove) {
            console.log('valid move');
            const [toX, toY] = to;
            const [fromX, fromY] = from;
            this.pieces[toX][toY] = piece;
            this.pieces[fromX][fromY] = null;
            this.active = this.active === "white" ? "black" : "white";

            this.listeners.forEach(listener => listener({
                status: this.status,
                pieces: this.pieces,
                active: this.active,
            }));
            return piece;
        } else {
            console.log('invalid move');
            return null;
        }
    }

    possibleMoves(from) {
        const piece = this.getPiece(from);

        let moves = [];
    
        switch(piece.type) {
            case 'pawn':
                // Pawns can move one or two squares forward, or one square diagonally forward
                moves = [[0, 1], [0, 2], [1, 1], [-1, 1]];
                break;
            case 'rook':
                // Rooks can move any number of squares along a rank or file
                for(let i = 1; i < 8; i++) {
                    moves.push([i, 0], [-i, 0], [0, i], [0, -i]);
                }
                break;
            case 'knight':
                // Knights can move to any square not on the same rank, file, or diagonal
                moves = [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]];
                break;
            case 'bishop':
                // Bishops can move any number of squares diagonally
                for(let i = 1; i < 8; i++) {
                    moves.push([i, i], [-i, -i], [i, -i], [-i, i]);
                }
                break;
            case 'queen':
                // Queens can move any number of squares along a rank, file, or diagonal
                for(let i = 1; i < 8; i++) {
                    moves.push([i, 0], [-i, 0], [0, i], [0, -i], [i, i], [-i, -i], [i, -i], [-i, i]);
                }
                break;
            case 'king':
                // Kings can move one square in any direction
                moves = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
                break;
        }

        const polarity = this.active === "black" ? 1 : -1;

        moves = moves.map(([x, y]) => [x * polarity, y * polarity]);
        
        const [fromX, fromY] = from;
    
        // Filter out moves that would go off the board
        moves = moves.filter(([toX, toY]) => {
            let [x, y] = [fromX + toX, fromY + toY];
            return x >= 0 && x < 8 && y >= 0 && y < 8;
        });

    
        return moves.map(([toX, toY]) => [toX + fromX, toY + fromY])
    }
}

class Square {
    constructor(position, onClick = () => {}) {
        this.position = position;
        this.onClick = onClick;
    }

    #handleClick(e) {
        this.onClick(this.position);
    }

    mount() {
        const [x, y] = this.position;
        const el = document.createElement("div");
        el.classList.add("square", colors[(x + y) % 2]);

        el.addEventListener("click", this.#handleClick.bind(this));

        this.el = el;
        return el;
    }

    render(highlighted, piece) {
        const [x, y] = this.position;
        if (highlighted) {
            this.el.classList.add("highlighted");
        } else {
            this.el.classList.remove("highlighted");
        }

        this.el.innerHTML = "";

        if (piece) {
            this.el.appendChild(piece.render());
        } else {
            this.el.innerHTML = `${letters[y]}-${x + 1}`;
        }
    }
}

class Controller {
    constructor(game) {
        game.addListener(this.render.bind(this));
        this.el = this.mount();
    }

    mount() {
        const el = document.createElement("div");
        el.classList.add("controller");

        this.el = el;
        return el;
    }

    render({active}) {
        this.el.innerHTML = active;
        return this.el;
    }
}

class Board {
    constructor(game) {
        this.game = game;
        this.squares = Array.from({length: 8}, () => Array(8).fill(null));
        this.selected = null;
        this.el = this.mount();

        game.addListener(this.render.bind(this));
    }

    #handleSquareSelect([x, y]) {
        const square = this.squares[x][y];

        if (Boolean(this.selected)) {
            const from = this.selected.position;
            const to = [x, y];

            this.selected = null;
            this.game.move(from, to)
        } else {
            const piece = this.game.getPiece([x, y]);
            if (piece && piece.color === this.game.active) {
                this.selected = square;
            }
        }

        this.render();
    }

    mount() {
        const el = document.createElement("div");
        el.classList.add("board");

        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y ++) {
                const square = new Square([x, y], this.#handleSquareSelect.bind(this));
                this.squares[x][y] = square;
                el.appendChild(square.mount());
            }
        }

        this.el = el;

        this.render();

        return el;
    }

    render() {
        const highlighted = this.selected
            ? this.game.possibleMoves(this.selected.position)
            : [];

        this.squares.forEach((row, x) => row.forEach((square, y) => {
            const isHighlighted = highlighted.some(([hx, hy]) => hx === x && hy === y);
            const piece = this.game.getPiece([x, y]);

            square.render(isHighlighted, piece);
        }));
    }
}


const game = new Game();

const board = new Board(game);
const controller = new Controller(game);

window.game = game;
window.board = board;

function render(root, children) {
    root.innerHTML = "";
    for (let child of children) {
        root.appendChild(child.mount());
    }
}

render(document.querySelector("#root"), [controller, board]);
