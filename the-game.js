//you lost
const secureRandom = require('secure-random');
const { sha3_256 } = require('js-sha3');
const prompt = require('prompt-sync')();
const { table } = require('table');

const movesAvailable = process.argv.slice(2);
let key;
let userMove = "";
let pcMove = "";
let pcMoveLists = [];
let hmac;
let menuText = "Moves available: \n";

const errorMessages = [
    "ERROR: Invalid argument amount. Expected an odd number of arguments (equal or greater than 3). ",
    "ERROR: Repeated arguments. Each argument must be unique and not repeat.",
    "ERROR: Invalid move. The move you chose does not exist."
];

function checkNotEnoughArguments(arr) {
    // return true if arg amoun is incorrect
    return arr.length < 3 || movesAvailable.length % 2 == 0;
}

function checkRepeatedArguments(arr) {
    // return true if there's any repeated args
    return arr.length !== Array.from(new Set(arr)).length;
}

function findMoves(moveChosen, moveList) {
    // figures out which moves lose/win against a given move
    // returns an array that contains two arrays: one of moves moveChosen loses to, and an array of moves it wins against
    let listRepeated = moveList.concat(moveList);
    let sideLength = (moveList.length - 1) / 2;
    let lostAgainst = [];
    let wonAgainst = [];
    let drawMove = [];
    let moves = [];
    let moveChosenIndex = moveList.findIndex((elem) => moveChosen == elem);

    if(moveChosenIndex < 0) {
        console.log(errorMessages[2]);
    } else {
        // console.log("Move chosen: " + moveChosen);
        for(let i = 1; i <= sideLength; i++) {
            lostAgainst.push(listRepeated[moveChosenIndex+i]);
        }
        moveChosenIndex += sideLength;
        for(let i = 1; i <= sideLength; i++) {
            wonAgainst.push(listRepeated[moveChosenIndex+i]);
        }
        drawMove.push(moveChosen);
        moves.push(lostAgainst);
        moves.push(wonAgainst);
        moves.push(drawMove);
    }

    // console.log(moves);
    return moves;
}

function validateMove(input, moveList) {
    //returns true if the input is invalid (doesn't exist or is not 0/?)
    let validInputs = [];

    for(let i = 0; i <= moveList.length; i++) {
        validInputs.push(i.toString());
    }
    validInputs.push("?");
    validInputs.push("^C");

    return validInputs.includes(input) ?  false :  true;
}

function makeRandomMove(moveList) {
    // randomly chooses a move from moveList, and returns its index
    return Math.floor(Math.random() * moveList.length);
}

function shiftElementsRight(arr) {
    //WARNING: THIS METHOD MODIFIES THE ORIGINAL ARRAY
    arr.unshift("");
    let last = arr.pop();
    arr[0] = last;
}

function makeDLWList(movesAvailable) {
    let sideLength = (movesAvailable.join().split(",").length - 1) / 2;
    let dlwList = [];
    
    dlwList.push("Draw");
    for(let i = 0; i < sideLength; i++) {
        dlwList.push("Loss");
    }
    for(let i = 0; i < sideLength; i++) {
        dlwList.push("Win");
    }
    return dlwList;
}

function buildTable(moveList, dlwList) {
    //returns data necessary to use the table() function (the "data" being an array of arrays)
    let bigArr = [];
    let dlwCopy = dlwList.slice();

    let topRow = moveList.slice();
    topRow.unshift("v PC / USER >");
    bigArr.push(topRow);

    for(let i = 0; i < moveList.length; i++) {
        let arrToPush = [];
        arrToPush.push(moveList[i]);
        arrToPush.push(dlwCopy);
        arrToPush = arrToPush.join().split(",");
        shiftElementsRight(dlwCopy);
        bigArr.push(arrToPush);
    }
    
    return bigArr;
}

function menuAndPrompt() {
    console.log("HMAC for this game: " + hmac);
    console.log(menuText);
    userMove = prompt("Enter your move number: ");
}


// findMoves("yeet", movesAvailable);

if(checkNotEnoughArguments(movesAvailable)) {
    console.log(errorMessages[0]);
} else if (checkRepeatedArguments(movesAvailable)) {
    console.log(errorMessages[1]);
} else {
    // generates a random key
    key = secureRandom(64, {type: 'Buffer'}).toString('hex');

    // computer chooses a move
    pcMove = makeRandomMove(movesAvailable);
    pcMoveLists = findMoves(movesAvailable.at(pcMove), movesAvailable);
    // console.log("hey, i chose " + movesAvailable[pcMove]); // this is for debuggin, no cheating okay?

    // calculate hmac with using the random key + the computer's move
    hmac = sha3_256(key + movesAvailable.at(pcMove));

    // build menu text with arguments given
    for(let i = 0; i < movesAvailable.length; i++) {
        menuText += `${i+1} - ${movesAvailable[i]} \n`;
    }
    menuText += `0 - exit \n?- help`;

    // displays menu and asks the user to choose an option, checking if it exists (also displays hmac too)
    console.log("~~~~~~~~~~~~~~~~GAME START~~~~~~~~~~~~~~~~");
    while(validateMove(userMove, movesAvailable)) {
        menuAndPrompt();
    }

    // checks user's move
    // is it a draw?
    if((userMove - 1) == pcMove) {
        console.log(`You (${movesAvailable[userMove - 1]}) VS Computer (${movesAvailable[pcMove]}): DRAW`);
        console.log("Original key used for this game: " + key);
        console.log("~~~~~~~~~~~~~~~~GAME END~~~~~~~~~~~~~~~~~~");
    }
    // user needs help?
    if(userMove == "?") {
        console.log("***Options table. Check what move will make you lose/win if PC chose X***");
        console.log(table(buildTable(movesAvailable, makeDLWList(movesAvailable))));
        menuAndPrompt();
    }
    // user wants to exit?
    if(userMove == 0) {
        console.log("Exiting program...");
        console.log("~~~~~~~~~~~~~~~~GAME END~~~~~~~~~~~~~~~~~~");
    }
    
    // is the user's move in the list of the pc's losing moves?
    if(pcMoveLists[0].includes(movesAvailable[userMove - 1])) {
        console.log(`You (${movesAvailable[userMove - 1]}) VS Computer (${movesAvailable[pcMove]}): You lost!`);
        console.log("Original key used for this game: " + key);
        console.log("~~~~~~~~~~~~~~~~GAME END~~~~~~~~~~~~~~~~~~");
    }

    // is the user's move in the list of the pc's winning moves
    if(pcMoveLists[1].includes(movesAvailable[userMove - 1])) {
        console.log(`You (${movesAvailable[userMove - 1]}) VS Computer (${movesAvailable[pcMove]}): You won!`);
        console.log("Key for this game: " + key);
    }
}