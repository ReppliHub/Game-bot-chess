document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('story-modal');
    const closeButton = document.querySelector('.close-button');
    const chessboard = document.getElementById('chessboard');
    const turnIndicator = document.getElementById('turn-indicator');

    modal.style.display = 'block';

    closeButton.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    let boardState = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];

    const pieceUnicode = {
        'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
        'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
    };

    let turn = 'white';
    let selectedPiece = null;
    let selectedSquare = null;
    let validMoves = [];
    let isAnimating = false;

    function renderBoard() {
        chessboard.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const square = document.createElement('div');
                square.classList.add('square');
                const color = (i + j) % 2 === 0 ? 'light' : 'dark';
                square.classList.add(color);
                square.dataset.row = i;
                square.dataset.col = j;

                if (selectedSquare && selectedSquare.row === i && selectedSquare.col === j) {
                    square.classList.add('selected');
                }

                if (validMoves.some(move => move.row === i && move.col === j)) {
                    square.classList.add('valid-move');
                }

                const piece = boardState[i][j];
                if (piece) {
                    const pieceColor = isWhitePiece(piece) ? 'white' : 'black';
                    square.innerHTML = `<span class="piece" data-piece="${piece}" style="color: ${pieceColor === 'white' ? '#f0f0f0' : '#333'}">${pieceUnicode[piece]}</span>`;
                }

                square.addEventListener('click', () => handleSquareClick(i, j));
                chessboard.appendChild(square);
            }
        }
        turnIndicator.textContent = `${turn.charAt(0).toUpperCase() + turn.slice(1)}'s Turn`;
    }

    function handleSquareClick(row, col) {
        if (isAnimating) return;

        if (selectedPiece) {
            const isMoveValid = validMoves.some(move => move.row === row && move.col === col);
            if (isMoveValid) {
                movePiece(selectedSquare.row, selectedSquare.col, row, col);
            } else {
                clearSelection();
                const piece = boardState[row][col];
                if (piece && isTurn(piece)) {
                    selectPiece(row, col);
                }
            }
        } else {
            const piece = boardState[row][col];
            if (piece && isTurn(piece)) {
                selectPiece(row, col);
            }
        }
    }

    function selectPiece(row, col) {
        selectedPiece = boardState[row][col];
        selectedSquare = { row, col };
        validMoves = getValidMoves(row, col, selectedPiece);
        renderBoard();
    }

    function clearSelection() {
        selectedPiece = null;
        selectedSquare = null;
        validMoves = [];
        renderBoard();
    }

    function movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = boardState[fromRow][fromCol];
        const fromSquareEl = document.querySelector(`[data-row='${fromRow}'][data-col='${fromCol}']`);
        const toSquareEl = document.querySelector(`[data-row='${toRow}'][data-col='${toCol}']`);

        animatePieceMove(fromSquareEl, toSquareEl, piece, () => {
            boardState[toRow][toCol] = piece;
            boardState[fromRow][fromCol] = '';
            switchTurn();
            clearSelection();
        });
    }

    function animatePieceMove(fromEl, toEl, piece, onComplete) {
        isAnimating = true;
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        const floatingPiece = document.createElement('div');
        floatingPiece.innerHTML = `<span class="piece">${pieceUnicode[piece]}</span>`;
        floatingPiece.classList.add('floating-piece');
        const pieceColor = isWhitePiece(piece) ? 'white' : 'black';
        floatingPiece.style.color = pieceColor === 'white' ? '#f0f0f0' : '#333';

        document.body.appendChild(floatingPiece);

        const startX = fromRect.left;
        const startY = fromRect.top;
        const endX = toRect.left;
        const endY = toRect.top;

        floatingPiece.style.transform = `translate(${startX}px, ${startY}px)`;

        // Hide original piece
        fromEl.querySelector('.piece').style.opacity = '0';

        requestAnimationFrame(() => {
            floatingPiece.style.transition = 'transform 0.3s ease-in-out';
            floatingPiece.style.transform = `translate(${endX}px, ${endY}px)`;
        });

        floatingPiece.addEventListener('transitionend', () => {
            floatingPiece.remove();
            onComplete();
            isAnimating = false;
        }, { once: true });
    }

    function switchTurn() {
        turn = turn === 'white' ? 'black' : 'white';
    }

    function isTurn(piece) {
        return (turn === 'white' && isWhitePiece(piece)) || (turn === 'black' && !isWhitePiece(piece));
    }

    function isWhitePiece(piece) {
        return piece === piece.toUpperCase();
    }

    function getValidMoves(row, col, piece) {
        const moves = [];
        const pieceType = piece.toLowerCase();

        switch (pieceType) {
            case 'p': moves.push(...getPawnMoves(row, col, piece)); break;
            case 'r': moves.push(...getRookMoves(row, col, piece)); break;
            case 'n': moves.push(...getKnightMoves(row, col, piece)); break;
            case 'b': moves.push(...getBishopMoves(row, col, piece)); break;
            case 'q': moves.push(...getQueenMoves(row, col, piece)); break;
            case 'k': moves.push(...getKingMoves(row, col, piece)); break;
        }
        return moves;
    }

    function getPawnMoves(row, col, piece) {
        const moves = [];
        const direction = isWhitePiece(piece) ? -1 : 1;
        const startRow = isWhitePiece(piece) ? 6 : 1;
        if (isInBounds(row + direction, col) && boardState[row + direction][col] === '') {
            moves.push({ row: row + direction, col });
            if (row === startRow && boardState[row + 2 * direction][col] === '') {
                moves.push({ row: row + 2 * direction, col });
            }
        }
        [-1, 1].forEach(side => {
            if (isInBounds(row + direction, col + side)) {
                const targetPiece = boardState[row + direction][col + side];
                if (targetPiece && !isSameColor(piece, targetPiece)) {
                    moves.push({ row: row + direction, col: col + side });
                }
            }
        });
        return moves;
    }

    function getRookMoves(row, col, piece) {
        return getSlidingMoves(row, col, piece, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
    }

    function getBishopMoves(row, col, piece) {
        return getSlidingMoves(row, col, piece, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
    }

    function getQueenMoves(row, col, piece) {
        return getSlidingMoves(row, col, piece, [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]);
    }

    function getKingMoves(row, col, piece) {
        const moves = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (isInBounds(newRow, newCol)) {
                const targetPiece = boardState[newRow][newCol];
                if (!targetPiece || !isSameColor(piece, targetPiece)) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        return moves;
    }

    function getKnightMoves(row, col, piece) {
        const moves = [];
        const directions = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (isInBounds(newRow, newCol)) {
                const targetPiece = boardState[newRow][newCol];
                if (!targetPiece || !isSameColor(piece, targetPiece)) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        return moves;
    }

    function getSlidingMoves(row, col, piece, directions) {
        const moves = [];
        for (const [dr, dc] of directions) {
            let newRow = row + dr;
            let newCol = col + dc;
            while (isInBounds(newRow, newCol)) {
                const targetPiece = boardState[newRow][newCol];
                if (targetPiece) {
                    if (!isSameColor(piece, targetPiece)) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                moves.push({ row: newRow, col: newCol });
                newRow += dr;
                newCol += dc;
            }
        }
        return moves;
    }

    function isInBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    function isSameColor(p1, p2) {
        return isWhitePiece(p1) === isWhitePiece(p2);
    }

    renderBoard();
});
