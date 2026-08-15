const Client = require('./Client');

const client = new Client();
client.init();

window.__client = client; 

console.log('Messages found:', client.messages.cache.size);
console.log('Users found:', client.users.cache.size);
console.log('Total messages:', client.messages.cache.size);

const all = [...client.messages.cache.values()];
console.log('Newest (by insertion order):', all[all.length - 1]);
console.log('Newest (by actual timestamp):', 
  [...all].sort((a, b) => new Date(a.createdTimestamp) - new Date(b.createdTimestamp)).at(-1)
);
