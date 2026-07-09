function isConnectedGroupOpt(users, sequence) {
    const ranges = new Int32Array(users.length * 2);

    for (let i = 0; i < users.length; i++) {
        const uId = users[i].id;
        let pIdx = -1;
        let dIdx = -1;

        for (let j = 0; j < sequence.length; j++) {
            if (sequence[j].userId === uId) {
                if (sequence[j].type === 'pickup') pIdx = j;
                else dIdx = j;
            }
        }
        ranges[i*2] = pIdx;
        ranges[i*2+1] = dIdx;
    }

    for (let i = 0; i < users.length; i++) {
        let hasOverlap = false;
        const p1 = ranges[i*2];
        const d1 = ranges[i*2+1];
        for (let j = 0; j < users.length; j++) {
            if (i === j) continue;
            const p2 = ranges[j*2];
            const d2 = ranges[j*2+1];
            if (p1 < d2 && p2 < d1) {
                hasOverlap = true;
                break;
            }
        }
        if (!hasOverlap) return false;
    }
    return true;
}

const { isConnectedGroup } = require('./route');

const users = [{id: 'A'}, {id: 'B'}, {id: 'C'}, {id: 'D'}];
const seq = [
    {userId: 'A', type: 'pickup'},
    {userId: 'B', type: 'pickup'},
    {userId: 'A', type: 'drop'},
    {userId: 'C', type: 'pickup'},
    {userId: 'D', type: 'pickup'},
    {userId: 'C', type: 'drop'},
    {userId: 'D', type: 'drop'},
    {userId: 'B', type: 'drop'},
];

const start1 = process.hrtime();
for (let i = 0; i < 50000; i++) {
    isConnectedGroup(users, seq);
}
const end1 = process.hrtime(start1);
console.log(`isConnectedGroup: ${end1[0]}s ${end1[1] / 1000000}ms`);


const start2 = process.hrtime();
for (let i = 0; i < 50000; i++) {
    isConnectedGroupOpt(users, seq);
}
const end2 = process.hrtime(start2);
console.log(`isConnectedGroupOpt: ${end2[0]}s ${end2[1] / 1000000}ms`);
