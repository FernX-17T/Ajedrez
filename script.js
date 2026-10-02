
let board;

let onPieceFocus = false;
let fieldOnFocus; // div that piece sits on
let pieceOnFocus; // img element#

let whitesTurn = true;

let whitePawnSwapCounter = "I";
let blackPawnSwapCounter = "I";

let enPassantPawn = null;

/*------castling rights-----*/
let whiteCanCastle = true;
let blackCanCastle = true;

let wKRookMoved = false;
let bKRookMoved = false;

let wQRookMoved = false;
let bQRookMoved = false;

/*--------------------------*/
let chessCheck = true;

let markedMoves = [];

function setupGame() {
    
    board = [["wrA", "wnB", "wbC", "wq", "wk", "wbF", "wnG","wrH"],
                ["wpA", "wpB", "wpC", "wpD", "wpE", "wpF", "wpG","wpH"],
                ["", "", "", "", "", "", "",""],
                ["", "", "", "", "", "", "",""],
                ["", "", "", "", "", "", "",""],
                ["", "", "", "", "", "", "",""],
                ["bpA", "bpB", "bpC", "bpD","bpE","bpF", "bpG" ,"bpH"],
                ["brA", "bnB", "bbC", "bq","bk","bbF", "bnG" ,"brH"]
            ];
}

function reset() {

    location.reload();
}

let playMode = "c";
let humansColor = "w";

let clockMode = "none";
let clockDuration = 5 * 60 * 1000;
let clockIncrement = 0;
let clockRemaining = { w: clockDuration, b: clockDuration };
let activeClockColor = null;
let clockInterval = null;
let lastClockTick = null;
let clockStarted = false;
let clockPaused = false;
let clockSettingsLocked = false;
let gameFinished = false;

function handleClockSettingsChange() {

    if(clockSettingsLocked) {
        return;
    }

    let mode = document.getElementById("clockMode").value;
    let options = document.getElementById("clockOptions");
    let incrementOption = document.getElementById("incrementOption");

    options.hidden = mode === "none";
    incrementOption.hidden = mode !== "chess";
    document.getElementById("clockMinutesLabel").textContent =
        mode === "turn"
            ? "Tiempo máximo por turno (minutos)"
            : "Tiempo inicial por jugador (minutos)";

    if(mode === "none") {
        clockMode = mode;
        document.getElementById("startClockButton").disabled = true;
        document.getElementById("clockStatus").textContent =
            "El reloj comenzará con el primer movimiento.";
        updateClockDisplay();
        return;
    }

    let minutesInput = document.getElementById("clockMinutes");
    let incrementInput = document.getElementById("clockIncrement");

    if(!minutesInput.checkValidity() ||
        (mode === "chess" && !incrementInput.checkValidity())) {
        document.getElementById("startClockButton").disabled = true;
        document.getElementById("clockStatus").textContent =
            "El tiempo debe ser de 1 a 180 minutos y el incremento de 0 a 60 segundos.";
        return;
    }

    clockMode = mode;
    document.getElementById("startClockButton").disabled = false;
    clockDuration = Number(minutesInput.value) * 60 * 1000;
    clockIncrement = mode === "chess" ? Number(incrementInput.value) * 1000 : 0;
    clockRemaining = { w: clockDuration, b: clockDuration };
    document.getElementById("clockStatus").textContent = mode === "turn"
        ? "Inicia la partida; cada turno tendrá el tiempo elegido."
        : "Inicia la partida para poner en marcha el reloj de blancas.";
    updateClockDisplay();
}

function initializeClockSettings() {

    let modeInput = document.getElementById("clockMode");
    let minutesInput = document.getElementById("clockMinutes");
    let incrementInput = document.getElementById("clockIncrement");
    let mode = modeInput.value;

    if(mode !== "none" &&
        (!minutesInput.checkValidity() ||
            (mode === "chess" && !incrementInput.checkValidity()))) {
        minutesInput.reportValidity();
        incrementInput.reportValidity();
        return false;
    }

    clockMode = mode;
    if(mode !== "none") {
        clockDuration = Number(minutesInput.value) * 60 * 1000;
        clockIncrement = mode === "chess" ? Number(incrementInput.value) * 1000 : 0;
    }
    clockRemaining = { w: clockDuration, b: clockDuration };
    clockSettingsLocked = true;
    modeInput.disabled = true;
    minutesInput.disabled = true;
    incrementInput.disabled = true;
    document.getElementById("startClockButton").disabled = true;
    updateClockDisplay();
    return true;
}

function startGameClock() {

    if(clockStarted || gameFinished || !initializeClockSettings()) {
        return;
    }

    if(clockMode === "none") {
        return;
    }

    clockStarted = true;
    activeClockColor = "w";
    document.getElementById("pauseClockButton").disabled = false;
    document.getElementById("clockStatus").textContent =
        "Reloj en marcha: turno de blancas.";
    startClockTicker();
    updateClockDisplay();
}

function formatClock(milliseconds) {

    let totalSeconds = Math.ceil(milliseconds / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    return String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
}

function updateClockDisplay() {

    let turnDisplay = document.getElementById("turnClockDisplay");
    let chessDisplay = document.getElementById("chessClockDisplay");

    turnDisplay.hidden = clockMode !== "turn";
    chessDisplay.hidden = clockMode !== "chess";

    if(clockMode === "turn") {
        let remaining = clockStarted && activeClockColor
            ? clockRemaining[activeClockColor]
            : clockDuration;
        document.getElementById("turnClock").textContent = formatClock(remaining);
    } else if(clockMode === "chess") {
        document.getElementById("whiteClock").textContent = formatClock(clockRemaining.w);
        document.getElementById("blackClock").textContent = formatClock(clockRemaining.b);
        document.getElementById("whiteClockPlayer").classList.toggle(
            "active", activeClockColor === "w" && !gameFinished
        );
        document.getElementById("blackClockPlayer").classList.toggle(
            "active", activeClockColor === "b" && !gameFinished
        );
    }
}

function startClockTicker() {

    if(clockInterval) {
        clearInterval(clockInterval);
    }

    lastClockTick = Date.now();
    clockInterval = setInterval(tickClock, 100);
}

function tickClock() {

    if(!clockStarted || clockPaused || gameFinished || !activeClockColor) {
        return true;
    }

    let now = Date.now();
    clockRemaining[activeClockColor] -= now - lastClockTick;
    lastClockTick = now;

    if(clockRemaining[activeClockColor] <= 0) {
        clockRemaining[activeClockColor] = 0;
        updateClockDisplay();
        let winner = activeClockColor === "w" ? "negras" : "blancas";
        finishGame("Se acabó el tiempo. Ganan las " + winner + ".");
        return false;
    }

    updateClockDisplay();
    return true;
}

function advanceClockAfterMove(movingColor, nextColor) {

    if(!clockSettingsLocked && !initializeClockSettings()) {
        return;
    }

    if(clockMode === "none") {
        return;
    }

    if(clockMode === "chess" && clockStarted) {
        clockRemaining[movingColor] += clockIncrement;
    } else if(clockMode === "turn") {
        clockRemaining[nextColor] = clockDuration;
    }

    clockStarted = true;
    activeClockColor = nextColor;
    document.getElementById("pauseClockButton").disabled = false;

    if(!clockPaused) {
        startClockTicker();
        document.getElementById("clockStatus").textContent =
            "Reloj en marcha: turno de " +
            (nextColor === "w" ? "blancas." : "negras.");
    }
    updateClockDisplay();
}

function toggleClockPause() {

    if(!clockStarted || gameFinished) {
        return;
    }

    let pauseButton = document.getElementById("pauseClockButton");

    if(clockPaused) {
        clockPaused = false;
        pauseButton.textContent = "Pausar reloj";
        document.getElementById("clockStatus").textContent =
            "Reloj en marcha.";
        startClockTicker();
    } else if(tickClock()) {
        clearInterval(clockInterval);
        clockInterval = null;
        lastClockTick = null;
        clockPaused = true;
        pauseButton.textContent = "Reanudar reloj";
        document.getElementById("clockStatus").textContent =
            "Reloj pausado.";
    }
}

function finishGame(message) {

    gameFinished = true;
    if(clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
    }
    lastClockTick = null;
    document.getElementById("turnIndicator").textContent = message;
    document.getElementById("moveCounter").textContent = "Partida finalizada.";
    document.getElementById("clockStatus").textContent = "Partida terminada.";
    document.getElementById("startClockButton").disabled = true;
    document.getElementById("pauseClockButton").disabled = true;

    if(fieldOnFocus) {
        deleteMarker();
        unmarkPiece();
    }
    updateClockDisplay();
}

function setHumanMode() {

    let humanButton = document.getElementById("humanMode");
    let comButton = document.getElementById("computerMode");

    if(playMode != "h") {
        playMode = "h";

        humanButton.style.backgroundColor = "#e68540";
        comButton.style.backgroundColor = "#4D7EA8";
    } else {
        alert("You already play Human vs Human");
    }
}

function setComputerMode() {

    let humanButton = document.getElementById("humanMode");
    let comButton = document.getElementById("computerMode");

    if(playMode != "c") {
        playMode = "c";

        if(whitesTurn) {
            humansColor = "w";
        } else {
            humansColor = "b";
        }

        humanButton.style.backgroundColor = "#4D7EA8";
        comButton.style.backgroundColor = "#e68540";
    } else {
        alert("You already play Human vs Computer");
    }
}

function movePiece(newField) {

    if(gameFinished) {
        return;
    }

    if(clockPaused) {
        document.getElementById("clockStatus").textContent =
            "Reloj pausado. Reanúdalo antes de mover.";
        return;
    }

    if(document.getElementById("clockMode").value !== "none" && !clockStarted) {
        document.getElementById("clockStatus").textContent =
            "Pulsa Iniciar partida antes de mover.";
        return;
    }

    newField = newField.parentElement;

    if(markedMoves.includes(newField.id)) {

        if(!clockSettingsLocked && !initializeClockSettings()) {
            return;
        }
        if(clockStarted && !tickClock()) {
            return;
        }

        // get position object of new piece position
        let newFieldPosition = fieldIdToBoardPosition(newField.id);

        /* -------visually remove catched Piece-------*/
        if(newField.classList.contains("catch")) {

            // get piece that is about to be catched from board
            let catchedPiece = board[newFieldPosition.row]
                [newFieldPosition.col];

            // delete ctached piece from dom
            let catchedPieceEm = document.getElementById(catchedPiece);
            catchedPieceEm.remove();
        }

        /* ---------moving visual piece img--------*/
        // get positioning classes of piece to move
        let pieceRow = pieceOnFocus.classList[1];
        let pieceCol = pieceOnFocus.classList[2];

        // remove positioning classes of piece to move
        pieceOnFocus.classList.remove(pieceRow);
        pieceOnFocus.classList.remove(pieceCol);

        // get positioning classes of new piece position
        let newPieceRow = newField.classList[2];
        let newPieceCol = newField.classList[3];

        // add the positioning classes of new position to piece
        pieceOnFocus.classList.add(newPieceRow);
        pieceOnFocus.classList.add(newPieceCol);


        /*-----------handle pawn promotion----*/
        // get piece position object of piece to move
        let piecePositionOnBoard = givePosition(board, pieceOnFocus.id);

        if(getPieceType(pieceOnFocus.id) == "wp" && newField.id.startsWith("8")) {
            
            pieceOnFocus.id = "wq" + whitePawnSwapCounter;
            pieceOnFocus.src = "assets/Chess_qlt60.png";

            // increase pawn swap counter to avoid same ids
            whitePawnSwapCounter = whitePawnSwapCounter + "I";

        } else if(getPieceType(pieceOnFocus.id) == "bp" && newField.id.startsWith("1")) {

            pieceOnFocus.id = "bq" + blackPawnSwapCounter;
            pieceOnFocus.src = "assets/Chess_qdt60.png";

            // increase pawn swap counter to avoid same ids
            blackPawnSwapCounter = blackPawnSwapCounter + "I";
        }

        /*------ check if its was castling move and rook has to be moved-----*/
        if(pieceOnFocus.id === "wk" && whiteCanCastle) {
            if(newField.id === "1G") {

                // move rook visually
                let wKRook = document.getElementById("wrH");
                
                let pieceRow = wKRook.classList[1];
                let pieceCol = wKRook.classList[2];

                wKRook.classList.remove(pieceRow);
                wKRook.classList.remove(pieceCol);

                wKRook.classList.add("row1");
                wKRook.classList.add("colF");

                // move rook on state board
                board[0][5] = "wrH";
                board[0][7] = "";

            } else if(newField.id === "1C") {

                // move rook visually
                let wQRook = document.getElementById("wrA");
                
                let pieceRow = wQRook.classList[1];
                let pieceCol = wQRook.classList[2];

                wQRook.classList.remove(pieceRow);
                wQRook.classList.remove(pieceCol);

                wQRook.classList.add("row1");
                wQRook.classList.add("colD");

                // move rook on state board
                board[0][3] = "wrA";
                board[0][0] = "";

            }
        } else if(pieceOnFocus.id === "bk" && blackCanCastle) {
            if(newField.id === "8G") {

                let bKRook = document.getElementById("brH");
                
                let pieceRow = bKRook.classList[1];
                let pieceCol = bKRook.classList[2];

                bKRook.classList.remove(pieceRow);
                bKRook.classList.remove(pieceCol);

                bKRook.classList.add("row8");
                bKRook.classList.add("colF");

                // move rook on state board
                board[7][5] = "brH";
                board[7][7] = "";

            } else if(newField.id === "8C") {

                let bQRook = document.getElementById("brA");

                let pieceRow = bQRook.classList[1];
                let pieceCol = bQRook.classList[2];

                bQRook.classList.remove(pieceRow);
                bQRook.classList.remove(pieceCol);

                bQRook.classList.add("row8");
                bQRook.classList.add("colD");

                // move rook on state board
                board[7][3] = "brA";
                board[7][0] = "";
            }
        }

        /*------------updating castling abilities-----------*/
        switch(pieceOnFocus.id) {

            case "wrA":
                wQRookMoved = true;
                break;

            case "wrH":
                wKRookMoved = true;
                break;
            
            case "brA":
                bQRookMoved = true;
                break;
            
            case "brH":
                bKRookMoved = true;
                break;

            case "bk":
                blackCanCastle = false;
                break;

            case "wk":
                whiteCanCastle = false;
                break;
        }

        /*--------if both rooks moved, player cant castle-----------*/
        if(wQRookMoved && wKRookMoved && whiteCanCastle) {
            whiteCanCastle = false;
        } else if(bKRookMoved && bQRookMoved && blackCanCastle){
            blackCanCastle = false;
        }

        /* catch piece if en passant move is made */
        if(enPassantPawn) {
            if(pieceOnFocus.id.indexOf('wp') === 0) {
                if(newFieldPosition.col === enPassantPawn.col && newFieldPosition.row === enPassantPawn.row + 1) {
                    
                    let catchedPawn = document.getElementById(board[enPassantPawn.row][enPassantPawn.col]);
    
                    catchedPawn.remove();
    
                    board[enPassantPawn.row][enPassantPawn.col] = "";
                }
            } else if(pieceOnFocus.id.indexOf('bp') === 0) {
                if(newFieldPosition.col === enPassantPawn.col && newFieldPosition.row === enPassantPawn.row - 1) {
    
                    let catchedPawn = document.getElementById(board[enPassantPawn.row][enPassantPawn.col]);
    
                    catchedPawn.remove();
    
                    board[enPassantPawn.row][enPassantPawn.col] = "";
                }
            }
        }
        
        /* --------update en passant pawn if necessary------------*/
        if(pieceOnFocus.id.indexOf('p') === 1 && Math.abs(piecePositionOnBoard.row - newFieldPosition.row) === 2) {
            enPassantPawn = newFieldPosition;
        } else {
            enPassantPawn = null;
        }
        
        // put piece to move on new position
        board[newFieldPosition.row][newFieldPosition.col] = pieceOnFocus.id;

        // clear entry of previous position
        board[piecePositionOnBoard.row][piecePositionOnBoard.col] = "";

        deleteMarker();
        unmarkPiece();
        changeTurn();

        /*--------check if in vs computer mode and next move has to be done automatically--------*/
        // check if there are move lefts
        if(playMode === "c") {

            if(whitesTurn && humansColor === "b") {
                makeComputerMove("w");
            };

            if(!whitesTurn && humansColor === "w") {
                makeComputerMove("b");
            }
            
        }

    } else {

        // clicked on field is not a legit move
        console.log("nope");
    }
}

function makeComputerMove(computerColor) {

    let randomMarker;

    let pieces = getAllActivePiecesOfPlayer(computerColor, board);

    /*------random search for a legit move----------*/
    while(randomMarker == null && getAllPossibleMovesOfPlayer(computerColor, board) != 0) {

        let randomPiece = pieces[Math.floor(Math.random() * pieces.length)];

        // delete randompiece from array to avoid randomly selecting it in next iteration
        const index = pieces.indexOf(randomPiece);
        if (index > -1) {
            pieces.splice(index, 1);
        }

        document.getElementById(randomPiece).click();

        let allMarkers = document.getElementsByClassName("marker");

        // unmark piece if no possible moves
        if(allMarkers.length === 0) {
            deleteMarker();
            unmarkPiece();
        } else {
            randomMarker = allMarkers[Math.floor(Math.random() * allMarkers.length)];
        }
    }

    /*-----wait a few seconds so user can see move------ */
    if(getAllPossibleMovesOfPlayer(computerColor, board) != 0) {
        setTimeout(function(){ 
            randomMarker.click();
        }, 1500);
    }
}

function changeTurn() {

    let em = document.getElementById("turnIndicator");

    let moveCounter = document.getElementById("moveCounter");

    let moveAmount;
    let movingColor = whitesTurn ? "w" : "b";

    if(whitesTurn) {

        // change to blacks turn
        whitesTurn = false;
        em.innerHTML = "Turno de negras ";

        moveAmount =  getAllPossibleMovesOfPlayer("b", board).length;
        
    } else {
        whitesTurn = true;
        em.innerHTML = "Turno de Blancas"

        moveAmount = getAllPossibleMovesOfPlayer("w", board).length;
    }

    advanceClockAfterMove(movingColor, whitesTurn ? "w" : "b");

    if(moveAmount === 0) {

        if(whitesTurn && checkIfPlayerIsInChess("w", board)) {
            finishGame("Jaque mate. Ganan las negras.");

        } else if (!whitesTurn && checkIfPlayerIsInChess("b", board)) {
            finishGame("Jaque mate. Ganan las blancas.");
        } else {
            finishGame("¡Ahogado! Tablas.");
        }

    } else {
        moveCounter.innerHTML = "Movimientos posibles:  " + moveAmount;
    }
    resaltarReyEnJaque();

}

function showMoves(element) {

    if(gameFinished) {
        return;
    }

    if(clockPaused) {
        document.getElementById("clockStatus").textContent =
            "Reloj pausado. Reanúdalo antes de mover.";
        return;
    }

    if(document.getElementById("clockMode").value !== "none" && !clockStarted) {
        document.getElementById("clockStatus").textContent =
            "Pulsa Iniciar partida antes de mover.";
        return;
    }

    let emId = element.id;

    let activeBoard = board;

    if((emId.startsWith("w") && whitesTurn) || (emId.startsWith("b") && !whitesTurn)) {

        if(pieceOnFocus) {
    
            deleteMarker();
            unmarkPiece();
        } else {
    
            pieceOnFocus = element;
    
            let piecePosition = givePosition(activeBoard, element.id);
    
            let pieceType = getPieceType(element.id);
    
            let legalMoves = getLegalMoves(piecePosition, pieceType, activeBoard);
    
            markPieceOnFocus(piecePosition);
            markLegalMoves(legalMoves);
        }
    }
}

function checkIfPieceIsOnField(position, activeBoard) {

    if(activeBoard[position.row][position.col]) {
        return true;
    } else {
        return false;
    }
}

function getColorOfPieceAtPosition(position, board) {

    let piece = board[position.row][position.col];
    return piece.charAt(0);
}

function makeMoveAndCheckIfChess(piecePosition, newPosition, playerColor) {

    let tempBoard = [["", "", "", "", "", "", "",""],
        ["", "", "", "", "", "", "",""],
        ["", "", "", "", "", "", "",""],
        ["", "", "", "", "", "", "",""],
        ["", "", "", "", "", "", "",""],
        ["", "", "", "", "", "", "",""],
        ["", "", "", "","","", "" ,""],
        ["", "", "", "","","", "" ,""]
    ];

    for(let i = 0; i < board.length; i++) {
        for(let j = 0; j < board[i].length; j++) {
            tempBoard[i][j] = board[i][j];
        }
    }

    // make move on tempBoard
    tempBoard[newPosition.row][newPosition.col] = tempBoard[piecePosition.row][piecePosition.col];
    tempBoard[piecePosition.row][piecePosition.col] = "";

    // check if player in chess
    return checkIfPlayerIsInChess(playerColor, tempBoard);
}

function makeMoveAndReturnNewBoard(piecePosition, newPosition) {

    let tempBoard = [["", "", "", "", "", "", "",""],
        ["", "", "", "", "", "", "",""],
        ["", "", "", "", "", "", "",""],
        ["", "", "", "", "", "", "",""],
        ["", "", "", "", "", "", "",""],
        ["", "", "", "", "", "", "",""],
        ["", "", "", "","","", "" ,""],
        ["", "", "", "","","", "" ,""]
    ];

    for(let i = 0; i < board.length; i++) {
        for(let j = 0; j < board[i].length; j++) {
            tempBoard[i][j] = board[i][j];
        }
    }

    // make move on tempBoard
    tempBoard[newPosition.row][newPosition.col] = tempBoard[piecePosition.row][piecePosition.col];
    tempBoard[piecePosition.row][piecePosition.col] = "";

    return tempBoard;
}

function getLegalMoves(piecePosition, pieceType, activeBoard) {

    let playerColor = getColorOfPieceAtPosition(piecePosition, activeBoard);

    let legalMoves = [];

    let position;

    switch(pieceType) {

        case "wp":
        // implement en passant

            if(piecePosition.row === 1) {

                // diagonal catches
                for(let k = -1; k < 2; k = k+2) {

                    position = {
                        row: piecePosition.row+1,
                        col: piecePosition.col+k
                    };

                    // check if a piece sits at a front diagonal field
                    if(checkIfPieceIsOnField(position, activeBoard)) {

                        // check if piece is of opposite color
                        if(getColorOfPieceAtPosition(position, activeBoard) != playerColor) {

                            if(chessCheck) {

                                // with this move player would still be in chess position or set self in chess
                                if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                    continue;
                                }
                            }
                            legalMoves.push(position);

                        }
                    } else {
                        continue;
                    }
                }
                

                for(let i = 1; i <= 2; i++) {

                    position = {
                        row: piecePosition.row+i,
                        col: piecePosition.col
                    };

                    if(checkIfPieceIsOnField(position, activeBoard)) {

                        break;
                    } else {
                        if(chessCheck) {

                            // with this move player would still be in chess position or set self in chess
                            if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                continue;
                            }
                        }
                        legalMoves.push(position);

                    }
                }

            } else {
                
                if(piecePosition.row+1 < 8) {
                    
                    // check if a piece can be catched diagonal
                    for(let k = -1; k < 2; k = k+2) {

                        position = {
                            row: piecePosition.row+1,
                            col: piecePosition.col+k
                        };

                        // check if a piece sits at a front diagonal field
                        if(checkIfPieceIsOnField(position, activeBoard)) {

                            // check if piece is of opposite color
                            if(getColorOfPieceAtPosition(position, activeBoard) != playerColor) {

                                if(chessCheck) {

                                    // with this move player would still be in chess position or set self in chess
                                    if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                        continue;
                                    }
                                }
                                legalMoves.push(position);

                            }
                        } else if (enPassantPawn){
                            /* check if diagonal en passant move is legal */
                            if(position.col === enPassantPawn.col && position.row === enPassantPawn.row + 1) {

                                if(chessCheck) {

                                    // with this move player would still be in chess position or set self in chess
                                    if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                        continue;
                                    }
                                }
                                legalMoves.push(position);
                            }
                        } else {
                            continue;
                        }
                    }
                    
                    position = {
                        row: piecePosition.row+1,
                        col: piecePosition.col
                    };
    
                    if(!checkIfPieceIsOnField(position, activeBoard)) {

                        if(chessCheck) {

                            // with this move player would still be in chess position or set self in chess
                            if(!makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                legalMoves.push(position);
                            }
                        }
                    }
                }   
            }
            break;

        case "bp":
        
            if(piecePosition.row === 6) {

                // diagonal catches
                for(let k = -1; k < 2; k = k+2) {

                    position = {
                        row: piecePosition.row-1,
                        col: piecePosition.col+k
                    };

                    // check if a piece sits at a front diagonal field
                    if(checkIfPieceIsOnField(position, activeBoard)) {

                        // check if piece is of opposite color
                        if(getColorOfPieceAtPosition(position, activeBoard) != playerColor) {

                            if(chessCheck) {

                                // with this move player would still be in chess position or set self in chess
                                if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                    continue;
                                }
                            }
                            legalMoves.push(position);

                        }
                    } else {
                        continue;
                    }
                }

                for(let i = 1; i <= 2; i++) {

                    position = {
                        row: piecePosition.row-i,
                        col: piecePosition.col
                    };

                    if(checkIfPieceIsOnField(position, activeBoard)) {

                        break;
                    } else {

                        if(chessCheck) {

                            // with this move player would still be in chess position or set self in chess
                            if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                continue;
                            }
                        }
                        legalMoves.push(position);

                    }
                }

            } else {

                if(piecePosition.row-1 >= 0) {
                    
                    // check if a piece can be catched diagonal
                    for(let k = -1; k < 2; k = k+2) {

                        position = {
                            row: piecePosition.row-1,
                            col: piecePosition.col+k
                        };

                        // check if a piece sits at a front diagonal field
                        if(checkIfPieceIsOnField(position, activeBoard)) {

                            // check if piece is of opposite color
                            if(getColorOfPieceAtPosition(position, activeBoard) != playerColor) {

                                if(chessCheck) {

                                    // with this move player would still be in chess position or set self in chess
                                    if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                        continue;
                                    }
                                }
                                legalMoves.push(position);

                            }
                        } else if (enPassantPawn){
                            /* check if diagonal en passant move is legal */
                            if(position.col === enPassantPawn.col && position.row === enPassantPawn.row - 1) {

                                if(chessCheck) {

                                    // with this move player would still be in chess position or set self in chess
                                    if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                        continue;
                                    }
                                }
                                legalMoves.push(position);
                            }
                        } else {
                            continue;
                        }
                    }
                    
                    position = {
                        row: piecePosition.row-1,
                        col: piecePosition.col
                    };
    
                    if(!checkIfPieceIsOnField(position, activeBoard)) {

                        if(chessCheck) {

                            // with this move player would still be in chess position or set self in chess
                            if(!makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                legalMoves.push(position);
                            }
                        }
                    }
                }   
            }
            break;

        case "n":

            for(let j = -1; j < 2; j++) {
                if(piecePosition.row+2 < 8) {

                    if(j != 0 && piecePosition.col+j >= 0 && piecePosition.col+j < 8) {

                        position = {
                            row: piecePosition.row+2,
                            col: piecePosition.col+j
                        };
                        
                        // check if piece is opposite color => catch 
                        if(getColorOfPieceAtPosition(position, activeBoard) != playerColor) {

                            if(chessCheck) {

                                // with this move player would still be in chess position or set self in chess
                                if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                    continue;
                                }
                            }
                            legalMoves.push(position);


                        }
                    }
                }    
            }

            for(let j = -1; j < 2; j++) {
                if(piecePosition.row-2 >= 0) {

                    if(j != 0 && piecePosition.col+j >= 0 && piecePosition.col+j < 8) {

                        position = {
                            row: piecePosition.row-2,
                            col: piecePosition.col+j
                        };

                        // check if piece is opposite color => catch 
                        if(getColorOfPieceAtPosition(position, activeBoard) != playerColor) {

                            if(chessCheck) {

                                // with this move player would still be in chess position or set self in chess
                                if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                    continue;
                                }
                            }

                            legalMoves.push(position);
                        }
                    }
                }   
            }

            for(let j = -1; j < 2; j++) {
                if(piecePosition.col+2 < 8) {

                    if(j != 0 && piecePosition.row+j >= 0 && piecePosition.row+j < 8) {

                        position = {
                            row: piecePosition.row+j,
                            col: piecePosition.col+2,
                        };

                        // check if piece is opposite color => catch 
                        if(getColorOfPieceAtPosition(position, activeBoard) != playerColor) {

                            if(chessCheck) {

                                // with this move player would still be in chess position or set self in chess
                                if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                    continue;
                                }
                            }

                            legalMoves.push(position);
                        }
                    }
                }   
            }

            for(let j = -1; j < 2; j++) {
                if(piecePosition.col-2 >= 0) {

                    if(j != 0 && piecePosition.row+j >= 0 && piecePosition.row+j < 8) {

                        position = {
                            row: piecePosition.row+j,
                            col: piecePosition.col-2,
                        };

                        // check if piece is opposite color => catch 
                        if(getColorOfPieceAtPosition(position, activeBoard) != playerColor) {

                            if(chessCheck) {

                                // with this move player would still be in chess position or set self in chess
                                if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                    continue;
                                }
                            }

                            legalMoves.push(position);
                        }
                    }
                }   
            }
            break;
        
        case "b":

            for(let j = 1; j < 8; j++) {

                if(piecePosition.row+j < 8 && piecePosition.col+j < 8) {
                    position = {
                        row: piecePosition.row+j,
                        col: piecePosition.col+j
                    }

                    let clr = getColorOfPieceAtPosition(position, activeBoard);

                    if(clr != playerColor) {

                        if(chessCheck) {

                            // with this move player would still be in chess position or set self in chess
                            if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                // if there's a collision at new position end here
                                if(clr) {
                                    break;
                                // if there's no coliision next move could still be valid
                                } else {
                                    continue;
                                }
                            }
                        }

                        legalMoves.push(position);

                        if(clr) {
                            break;
                        }
                    }  else {
                        break;
                    }

                } else {
                    // out of bounds
                    break;
                }   
            }    

            for(let j = 1; j < 8; j++) {

                if(piecePosition.row+j < 8 && piecePosition.col-j >= 0) {
                    position = {
                        row: piecePosition.row+j,
                        col: piecePosition.col-j
                    }

                    let clr = getColorOfPieceAtPosition(position, activeBoard);

                    if(clr != playerColor) {

                        if(chessCheck) {

                            // with this move player would still be in chess position or set self in chess
                            if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                // if there's a collision at new position end here
                                if(clr) {
                                    break;
                                // if there's no coliision next move could still be valid
                                } else {
                                    continue;
                                }
                            }
                        }

                        legalMoves.push(position);

                        if(clr) {
                            break;
                        }
                    }  else {
                        break;
                    }

                } else {
                    // out of bounds
                    break;
                }   
            }

            for(let j = 1; j < 8; j++) {

                if(piecePosition.row-j >= 0 && piecePosition.col-j >= 0) {
                    position = {
                        row: piecePosition.row-j,
                        col: piecePosition.col-j
                    }

                    let clr = getColorOfPieceAtPosition(position, activeBoard);

                    if(clr != playerColor) {

                        if(chessCheck) {

                            // with this move player would still be in chess position or set self in chess
                            if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                // if there's a collision at new position end here
                                if(clr) {
                                    break;
                                // if there's no coliision next move could still be valid
                                } else {
                                    continue;
                                }
                            }
                        }

                        legalMoves.push(position);

                        if(clr) {
                            break;
                        }
                    }  else {
                        break;
                    }

                } else {
                    // out of bounds
                    break;
                }   
            }

            for(let j = 1; j < 8; j++) {

                if(piecePosition.row-j >= 0 && piecePosition.col+j < 8) {
                    position = {
                        row: piecePosition.row-j,
                        col: piecePosition.col+j
                    }

                    let clr = getColorOfPieceAtPosition(position, activeBoard);

                    if(clr != playerColor) {

                        if(chessCheck) {

                            // with this move player would still be in chess position or set self in chess
                            if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                // if there's a collision at new position end here
                                if(clr) {
                                    break;
                                // if there's no coliision next move could still be valid
                                } else {
                                    continue;
                                }
                            }
                        }

                        legalMoves.push(position);

                        if(clr) {
                            break;
                        }
                    } else {
                        break;
                    }

                } else {
                    // out of bounds
                    break;
                }   
            }

            break;

        case "r":

            for(let j = piecePosition.row+1; j < 8; j++) {  
                    
                position = {
                    row: j,
                    col: piecePosition.col
                }

                let clr = getColorOfPieceAtPosition(position, activeBoard);

                if(clr != playerColor) {

                    if(chessCheck) {

                        // with this move player would still be in chess position or set self in chess
                        if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                            // if there's a collision at new position end here
                            if(clr) {
                                break;
                            // if there's no coliision next move could still be valid
                            } else {
                                continue;
                            }
                        }
                    }

                    legalMoves.push(position);

                    if(clr) {
                        break;
                    }
                } else {
                    break;
                } 
            }

            for(let j = piecePosition.row-1; j >= 0; j--) {
                        
                position = {
                    row: j,
                    col: piecePosition.col
                }

                let clr = getColorOfPieceAtPosition(position, activeBoard);

                if(clr != playerColor) {

                    if(chessCheck) {

                        // with this move player would still be in chess position or set self in chess
                        if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                            // if there's a collision at new position end here
                            if(clr) {
                                break;
                            // if there's no coliision next move could still be valid
                            } else {
                                continue;
                            }
                        }
                    }

                    legalMoves.push(position);

                    if(clr) {
                        break;
                    }
                } else {
                    break;
                }
            }

            for(let j = piecePosition.col+1; j < 8; j++) {
                        
                position = {
                    row: piecePosition.row,
                    col: j
                }

                let clr = getColorOfPieceAtPosition(position, activeBoard);

                if(clr != playerColor) {

                    if(chessCheck) {

                        // with this move player would still be in chess position or set self in chess
                        if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                            // if there's a collision at new position end here
                            if(clr) {
                                break;
                            // if there's no coliision next move could still be valid
                            } else {
                                continue;
                            }
                        }
                    }

                    legalMoves.push(position);

                    if(clr) {
                        break;
                    }
                } else {
                    break;
                }
            }

            for(let j = piecePosition.col-1; j >= 0; j--) {
                        
                position = {
                    row: piecePosition.row,
                    col: j
                }

                let clr = getColorOfPieceAtPosition(position, activeBoard);

                if(clr != playerColor) {

                    if(chessCheck) {

                        // with this move player would still be in chess position or set self in chess
                        if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                            // if there's a collision at new position end here
                            if(clr) {
                                break;
                            // if there's no coliision next move could still be valid
                            } else {
                                continue;
                            }
                        }
                    }

                    legalMoves.push(position);

                    if(clr) {
                        break;
                    }
                } else {
                    break;
                }
            }

            break;

        case "q":

            /*-------rook movement---------*/
            for(let j = piecePosition.row+1; j < 8; j++) {  
                    
                position = {
                    row: j,
                    col: piecePosition.col
                }

                let clr = getColorOfPieceAtPosition(position, activeBoard);

                if(clr != playerColor) {

                    if(chessCheck) {

                        // with this move player would still be in chess position or set self in chess
                        if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                            // if there's a collision at new position end here
                            if(clr) {
                                break;
                            // if there's no coliision next move could still be valid
                            } else {
                                continue;
                            }
                        }
                    }

                    legalMoves.push(position);

                    if(clr) {
                        break;
                    }
                } else {
                    break;
                } 
            }

            for(let j = piecePosition.row-1; j >= 0; j--) {
                        
                position = {
                    row: j,
                    col: piecePosition.col
                }

                let clr = getColorOfPieceAtPosition(position, activeBoard);

                if(clr != playerColor) {

                    if(chessCheck) {

                        // with this move player would still be in chess position or set self in chess
                        if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                            // if there's a collision at new position end here
                            if(clr) {
                                break;
                            // if there's no coliision next move could still be valid
                            } else {
                                continue;
                            }
                        }
                    }

                    legalMoves.push(position);

                    if(clr) {
                        break;
                    }
                } else {
                    break;
                }
            }

            for(let j = piecePosition.col+1; j < 8; j++) {
                        
                position = {
                    row: piecePosition.row,
                    col: j
                }

                let clr = getColorOfPieceAtPosition(position, activeBoard);

                if(clr != playerColor) {

                    if(chessCheck) {

                        // with this move player would still be in chess position or set self in chess
                        if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                            // if there's a collision at new position end here
                            if(clr) {
                                break;
                            // if there's no coliision next move could still be valid
                            } else {
                                continue;
                            }
                        }
                    }

                    legalMoves.push(position);

                    if(clr) {
                        break;
                    }
                } else {
                    break;
                }
            }

            for(let j = piecePosition.col-1; j >= 0; j--) {
                        
                position = {
                    row: piecePosition.row,
                    col: j
                }

                let clr = getColorOfPieceAtPosition(position, activeBoard);

                if(clr != playerColor) {

                    if(chessCheck) {

                        // with this move player would still be in chess position or set self in chess
                        if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                            // if there's a collision at new position end here
                            if(clr) {
                                break;
                            // if there's no coliision next move could still be valid
                            } else {
                                continue;
                            }
                        }
                    }

                    legalMoves.push(position);

                    if(clr) {
                        break;
                    }
                } else {
                    break;
                }
            }


            /*-------bishop movement---------*/
            for(let j = 1; j < 8; j++) {

                if(piecePosition.row+j < 8 && piecePosition.col+j < 8) {
                    position = {
                        row: piecePosition.row+j,
                        col: piecePosition.col+j
                    }

                    let clr = getColorOfPieceAtPosition(position, activeBoard);

                    if(clr != playerColor) {

                        if(chessCheck) {

                            // with this move player would still be in chess position or set self in chess
                            if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                // if there's a collision at new position end here
                                if(clr) {
                                    break;
                                // if there's no coliision next move could still be valid
                                } else {
                                    continue;
                                }
                            }
                        }

                        legalMoves.push(position);

                        if(clr) {
                            break;
                        }
                    }  else {
                        break;
                    }

                } else {
                    // out of bounds
                    break;
                }   
            }    

            for(let j = 1; j < 8; j++) {

                if(piecePosition.row+j < 8 && piecePosition.col-j >= 0) {
                    position = {
                        row: piecePosition.row+j,
                        col: piecePosition.col-j
                    }

                    let clr = getColorOfPieceAtPosition(position, activeBoard);

                    if(clr != playerColor) {

                        if(chessCheck) {

                            // with this move player would still be in chess position or set self in chess
                            if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                // if there's a collision at new position end here
                                if(clr) {
                                    break;
                                // if there's no coliision next move could still be valid
                                } else {
                                    continue;
                                }
                            }
                        }

                        legalMoves.push(position);

                        if(clr) {
                            break;
                        }
                    }  else {
                        break;
                    }

                } else {
                    // out of bounds
                    break;
                }   
            }

            for(let j = 1; j < 8; j++) {

                if(piecePosition.row-j >= 0 && piecePosition.col-j >= 0) {
                    position = {
                        row: piecePosition.row-j,
                        col: piecePosition.col-j
                    }

                    let clr = getColorOfPieceAtPosition(position, activeBoard);

                    if(clr != playerColor) {

                        if(chessCheck) {

                            // with this move player would still be in chess position or set self in chess
                            if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                // if there's a collision at new position end here
                                if(clr) {
                                    break;
                                // if there's no coliision next move could still be valid
                                } else {
                                    continue;
                                }
                            }
                        }

                        legalMoves.push(position);

                        if(clr) {
                            break;
                        }
                    }  else {
                        break;
                    }

                } else {
                    // out of bounds
                    break;
                }   
            }

            for(let j = 1; j < 8; j++) {

                if(piecePosition.row-j >= 0 && piecePosition.col+j < 8) {
                    position = {
                        row: piecePosition.row-j,
                        col: piecePosition.col+j
                    }

                    let clr = getColorOfPieceAtPosition(position, activeBoard);

                    if(clr != playerColor) {

                        if(chessCheck) {

                            // with this move player would still be in chess position or set self in chess
                            if(makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                // if there's a collision at new position end here
                                if(clr) {
                                    break;
                                // if there's no coliision next move could still be valid
                                } else {
                                    continue;
                                }
                            }
                        }

                        legalMoves.push(position);

                        if(clr) {
                            break;
                        }
                    } else {
                        break;
                    }

                } else {
                    // out of bounds
                    break;
                }   
            }

            break;

        case "k":

            /*------ white castling moves */
            if(playerColor === "w" && whiteCanCastle) {

                if(!wKRookMoved && activeBoard[0][5] === "" && activeBoard[0][6] === "") {
                    
                    position = {
                        row: piecePosition.row,
                        col : piecePosition.col+2
                    };

                    /* --- check castling rules for temporary loss of castling ability */
                    let illegalMove = false;

                    // king in chess 
                    let opponentMoves = getAllPossibleMovesOfPlayer("b", board);

                    for(let move of opponentMoves) {
                        if(move.row === 0 && move.col === 4) {
                            illegalMove = true;
                        }
                    }

                    // king crosses a field that can be captured
                    let tempPosition = {
                        row: piecePosition.row,
                        col: piecePosition.col+1
                    };

                    let boardAfterTempMove = makeMoveAndReturnNewBoard(piecePosition, tempPosition);
                    let opponentMovesAfterTempMove = getAllPossibleMovesOfPlayer("b", boardAfterTempMove);

                    for(let move of opponentMovesAfterTempMove) {
                        if(move.row === 0 && move.col === 5) {
                            illegalMove = true;
                        }
                    }

                    // king in chess position after castling
                    let boardAfterMove = makeMoveAndReturnNewBoard(piecePosition, position);
                    let opponentMovesAfterMove = getAllPossibleMovesOfPlayer("b", boardAfterMove);

                    for(let move of opponentMovesAfterMove) {
                        if(move.row === 0 && move.col === 6) {
                            illegalMove = true;
                        }
                    }   

                    if(!illegalMove) {
                        legalMoves.push(position);
                    }
                }

                if(!wQRookMoved && activeBoard[0][1] === "" && activeBoard[0][2] === "" && activeBoard[0][3] === "") {

                    position = {
                        row: piecePosition.row,
                        col : piecePosition.col-2
                    };

                    /* --- check castling rules for temporary loss of castling ability */
                    let illegalMove = false;

                    // king in chess 
                    let opponentMoves = getAllPossibleMovesOfPlayer("b", board);

                    for(let move of opponentMoves) {
                        if(move.row === 0 && move.col === 4) {
                            illegalMove = true;
                        }
                    }

                    // king crosses a field that can be captured
                    let tempPosition = {
                        row: piecePosition.row,
                        col: piecePosition.col-1
                    };

                    let boardAfterTempMove = makeMoveAndReturnNewBoard(piecePosition, tempPosition);
                    let opponentMovesAfterTempMove = getAllPossibleMovesOfPlayer("b", boardAfterTempMove);

                    for(let move of opponentMovesAfterTempMove) {
                        if(move.row === 0 && move.col === 3) {
                            illegalMove = true;
                        }
                    }

                    // king in chess position after castling
                    let boardAfterMove = makeMoveAndReturnNewBoard(piecePosition, position);
                    let opponentMovesAfterMove = getAllPossibleMovesOfPlayer("b", boardAfterMove);

                    for(let move of opponentMovesAfterMove) {
                        if(move.row === 0 && move.col === 2) {
                            illegalMove = true;
                        }
                    }   

                    if(!illegalMove) {
                        legalMoves.push(position);
                    }
                }
            } else if(playerColor === "b" && blackCanCastle) {

                if(!bKRookMoved && activeBoard[7][5] === "" && activeBoard[7][6] === "") {

                    position = {
                        row: piecePosition.row,
                        col : piecePosition.col+2
                    };

                    /* --- check castling rules for temporary loss of castling ability */
                    let illegalMove = false;

                    // king in chess 
                    let opponentMoves = getAllPossibleMovesOfPlayer("w", board);

                    for(let move of opponentMoves) {
                        if(move.row === 7 && move.col === 4) {
                            illegalMove = true;
                        }
                    }

                    // king crosses a field that can be captured
                    let tempPosition = {
                        row: piecePosition.row,
                        col: piecePosition.col+1
                    };

                    let boardAfterTempMove = makeMoveAndReturnNewBoard(piecePosition, tempPosition);
                    let opponentMovesAfterTempMove = getAllPossibleMovesOfPlayer("w", boardAfterTempMove);

                    for(let move of opponentMovesAfterTempMove) {
                        if(move.row === 7 && move.col === 5) {
                            illegalMove = true;
                        }
                    }

                    // king in chess position after castling
                    let boardAfterMove = makeMoveAndReturnNewBoard(piecePosition, position);
                    let opponentMovesAfterMove = getAllPossibleMovesOfPlayer("w", boardAfterMove);

                    for(let move of opponentMovesAfterMove) {
                        if(move.row === 7 && move.col === 6) {
                            illegalMove = true;
                        }
                    }   

                    if(!illegalMove) {
                        legalMoves.push(position);
                    }
                }

                if(!bQRookMoved && activeBoard[7][1] === "" && activeBoard[7][2] === "" && activeBoard[7][3] === "") {

                    position = {
                        row: piecePosition.row,
                        col : piecePosition.col-2
                    };

                    /* --- check castling rules for temporary loss of castling ability */
                    let illegalMove = false;

                    // king in chess 
                    let opponentMoves = getAllPossibleMovesOfPlayer("w", board);

                    for(let move of opponentMoves) {
                        if(move.row === 7 && move.col === 4) {
                            illegalMove = true;
                        }
                    }

                    // king crosses a field that can be captured
                    let tempPosition = {
                        row: piecePosition.row,
                        col: piecePosition.col-1
                    };

                    let boardAfterTempMove = makeMoveAndReturnNewBoard(piecePosition, tempPosition);
                    let opponentMovesAfterTempMove = getAllPossibleMovesOfPlayer("w", boardAfterTempMove);

                    for(let move of opponentMovesAfterTempMove) {
                        if(move.row === 7 && move.col === 3) {
                            illegalMove = true;
                        }
                    }

                    // king in chess position after castling
                    let boardAfterMove = makeMoveAndReturnNewBoard(piecePosition, position);
                    let opponentMovesAfterMove = getAllPossibleMovesOfPlayer("w", boardAfterMove);

                    for(let move of opponentMovesAfterMove) {
                        if(move.row === 7 && move.col === 2) {
                            illegalMove = true;
                        }
                    }   

                    if(!illegalMove) {
                        legalMoves.push(position);
                    }
                }
            }

            for(let j = -1; j < 2; j++) {

                if(j == 0) {
                    
                    if(piecePosition.col-1 >= 0 && piecePosition.col-1 < 8) {

                        position = {
                            row: piecePosition.row,
                            col : piecePosition.col-1
                        };

                        if(getColorOfPieceAtPosition(position, activeBoard) != playerColor) {

                            if(chessCheck) {

                                // this move doesnt set player in chess
                                if(!makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                    legalMoves.push(position);
                                }
                            } else {
                                legalMoves.push(position);
                            }
                        }
                        
                    }

                    if(piecePosition.col+1 >= 0 && piecePosition.col+1 < 8) {

                        position = {
                            row: piecePosition.row,
                            col : piecePosition.col+1
                        };

                        if(getColorOfPieceAtPosition(position, activeBoard) != playerColor) {

                            if(chessCheck) {

                                // this move doesnt set player in chess
                                if(!makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                    legalMoves.push(position);
                                }
                            } else {
                                legalMoves.push(position);
                            }
                        }
                    }
                    
                } else {

                    if(piecePosition.row+j >= 0 && piecePosition.row+j < 8) {
                        
                        for( let k = -1; k < 2; k++) {

                            if(piecePosition.col+k >= 0 && piecePosition.col+k < 8) {
                                position = {
                                    row: piecePosition.row+j,
                                    col : piecePosition.col+k
                                };

                                if(getColorOfPieceAtPosition(position, activeBoard) != playerColor) {

                                    if(chessCheck) {

                                        // this move doesnt set player in chess
                                        if(!makeMoveAndCheckIfChess(piecePosition, position, playerColor)) {
                                            legalMoves.push(position);
                                        }
                                    } else {
                                        legalMoves.push(position);
                                    }
                                }
                            }
                        }
                    } else {
                        // out of bounds
                        continue;
                    }
                }
            }

            break;
    }
    return legalMoves;
}


function deleteMarker() {

    let marker = document.getElementsByClassName("marker");

    let captureFields = document.getElementsByClassName("catch");

    while(marker[0]) {
        marker[0].remove();
    }

    while(captureFields[0]) {
        captureFields[0].classList.remove("catch");
    }

    markedMoves = [];
}

function getFieldFromPosition(position) {

    let row = position.row + 1;
    let col;
    
    switch(position.col) {

        case 0:
        	col = "A";
            break;
            
        case 1:
            col = "B";
            break;

        case 2:
            col = "C";
            break;

        case 3:
            col = "D";
            break;

        case 4:
            col = "E";
            break;

        case 5:
            col = "F";
            break;

        case 6:
            col = "G";
            break;

        case 7:
            col = "H";
            break;
    }

    return row+col;
}

function markPieceOnFocus(piecePosition) {

    onPieceFocus = true;

    let boardPosition = getFieldFromPosition(piecePosition);

    fieldOnFocus = document.getElementById(boardPosition);

    fieldOnFocus.style.backgroundColor = "#87CEEB";
}

function unmarkPiece() {

    pieceOnFocus = null;

    fieldOnFocus.style.backgroundColor = "";

    fieldOnFocus = null;
}

function markLegalMoves(positions) {

    for(let position of positions) {

        let boardPosition = getFieldFromPosition(position);

        markedMoves.push(boardPosition);

        let field = document.getElementById(boardPosition);

        if(checkIfPieceIsOnField(position, board)) {

            field.classList.add("catch");
        }

        let dot = document.createElement("div");

        dot.classList.add("marker");
        dot.setAttribute("onclick", "movePiece(this)");
        dot.innerHTML = "•";

        field.appendChild(dot);
    }

}

function getPieceType(id) {

    let arr = Array.from(id);

    if(arr[1] === 'p') {
        return arr[0] + arr[1];
    } else {
        return arr[1];
    }

}

function givePosition(boardArray, elementId) {

    for(let i = 0; i < boardArray.length; i++) {
        for(let j = 0; j < boardArray[i].length; j++) {

            if(boardArray[i][j] === elementId) {
                return position = {
                    row: i,
                    col: j
                };
            }
        }
    }
}

function fieldIdToBoardPosition(fieldId) {

    let id = Array.from(fieldId);
    let row;
    let col;

    switch(id[0]) {

        case '1':
            row = 0;
            break;
        case '2':
            row = 1;
            break;
        case '3':
            row = 2;
            break;
        case '4':
            row = 3;
            break;
        case '5':
            row = 4;
            break;
        case '6':
            row = 5;
            break;
        case '7':
            row = 6;
            break;
        case '8':
            row = 7;
            break;
    }

    switch(id[1]) {

        case 'A':
            col = 0;
            break;
        case 'B':
            col = 1;
            break;
        case 'C':
            col = 2;
            break;
        case 'D':
            col = 3;
            break;
        case 'E':
            col = 4;
            break;
        case 'F':
            col = 5;
            break;
        case 'G':
            col = 6;
            break;
        case 'H':
            col = 7;
            break;
    }

    return position = {
        row: row,
        col: col
    };
}

function getAllActivePiecesOfPlayer(player, activeBoard) {

    let activePiecesOfPlayer = [];

    for(let i = 0; i < activeBoard.length; i++) {
        for(let j = 0; j < activeBoard[i].length; j++) {

            if(activeBoard[i][j].startsWith(player)) {
                activePiecesOfPlayer.push(activeBoard[i][j]);
            }
        }
    }

    return activePiecesOfPlayer;
}

function getAllPossibleMovesOfPlayer(player, activeBoard) {

    let activePiecesOfPlayer = getAllActivePiecesOfPlayer(player, activeBoard);

    let possibleMoves = [];

    for(let piece of activePiecesOfPlayer) {
        
        let posi = givePosition(activeBoard, piece);

        let type = getPieceType(piece);

        let moves = getLegalMoves(posi, type, activeBoard);

        for(let move of moves) {
            possibleMoves.push(move);
        }
    }
    return possibleMoves;
}

function getKingPositionOfPlayer(player, activeBoard) {

    for(let i = 0; i < activeBoard.length; i++) {
        for (let j = 0; j < activeBoard[i].length; j++) {
            if(activeBoard[i][j] == player + "k") {
                	return {
                        row: i,
                        col: j
                    }
            }
        }
    }
}

function checkIfPlayerIsInChess(player, activeBoard) {

    let opponent;

    if(player === "w") {
        opponent = "b";
    } else {
        opponent = "w";
    }

    chessCheck = false;

    let possibleMoves = getAllPossibleMovesOfPlayer(opponent, activeBoard);

    let kingsPosition = getKingPositionOfPlayer(player, activeBoard);

    chessCheck = true;

    for(let move of possibleMoves) {

        if(move.row === kingsPosition.row && move.col === kingsPosition.col) {
            return true;
        }
    }
    return false;
}

function resaltarReyEnJaque() {
    // Primero quitamos cualquier resaltado previo
    let wk = document.getElementById("wk");
    let bk = document.getElementById("bk");

    wk.style.filter = "";
    bk.style.filter = "";

    // Si el rey blanco está en jaque
    if (checkIfPlayerIsInChess("w", board)) {
        wk.style.filter = "drop-shadow(0 0 12px red)";
    }

    // Si el rey negro está en jaque
    if (checkIfPlayerIsInChess("b", board)) {
        bk.style.filter = "drop-shadow(0 0 12px red)";
    }
}


setupGame();
handleClockSettingsChange();