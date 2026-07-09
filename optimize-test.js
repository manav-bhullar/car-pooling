const { isConnectedGroup } = require('./server/src/modules/matching/route');

const users = [{id: 'A'}, {id: 'B'}];
const seq = [
    {userId: 'A', type: 'pickup'},
    {userId: 'B', type: 'pickup'},
    {userId: 'A', type: 'drop'},
    {userId: 'B', type: 'drop'},
];

console.log(isConnectedGroup(users, seq));
