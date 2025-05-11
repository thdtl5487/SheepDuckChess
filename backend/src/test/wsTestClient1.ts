import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:4001');

ws.on('open', () => {
    console.log('🔌 Connected to match-server');

    const myRating = makeRandomRating();
    const myName = '양념이' + myRating;

    console.log(`my Name : ${myName}, rating : ${myRating}`)

    const joinQueueMessage = {
        type: 'JOIN_QUEUE',
        payload: {
            usn: 1,
            nick: myName,
            rating: myRating,
            skinSetting: {
                pawn: 1, knight: 3, bishop: 5,
                rook: 7, queen: 9, king: 11,
                boardSkin: 2, character: 4
            },
            maxDiff: 50
        }
    };

    ws.send(JSON.stringify(joinQueueMessage));
});

ws.on('message', (data) => {
    console.log('📩 Received:', data.toString());
});

ws.on('close', () => {
    console.log('❌ Disconnected');
});

function makeRandom(){

    return Math.floor(Math.random() * 100);
}

function makeRandomRating(){
    let result = Math.floor(Math.random() * 500);

    while(result <= 200){
        result = Math.floor(Math.random() * 500);
    }


    return result;
}