const { isConnectedGroup } = require('./server/src/modules/matching/route');

const users = [{id: 'A'}, {id: 'B'}, {id: 'C'}, {id: 'D'}];
const seq = [
    {userId: 'A', type: 'pickup'},
    {userId: 'B', type: 'pickup'},
    {userId: 'A', type: 'drop'},
    {userId: 'B', type: 'drop'},
    {userId: 'C', type: 'pickup'},
    {userId: 'D', type: 'pickup'},
    {userId: 'C', type: 'drop'},
    {userId: 'D', type: 'drop'},
];

console.log(isConnectedGroup(users, seq));
