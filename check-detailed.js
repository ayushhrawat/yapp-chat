import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://rawatayushh412_db_user:rxz12NL3RBdGfjUx@yappchat.lrrxtcj.mongodb.net/yapp-chat?retryWrites=true&w=majority&ssl=true';

async function checkDetailed() {
 const client = new MongoClient(uri);
  await client.connect();
 const db = client.db('yapp-chat');
  
 const convos = await db.collection('conversations').find({}).toArray();
 console.log('\n=== ALL CONVERSATIONS ===');
 console.log('Total:', convos.length);
  
 convos.forEach((c, i) => {
    console.log(`\n[${i}] ID: ${c._id}`);
    console.log(`    Participants Array:`, c.participants);
    console.log(`    Participants Length: ${c.participants.length}`);
    console.log(`    Participant1: "${c.participants[0]}"`);
    console.log(`    Participant 2: "${c.participants[1] || '(undefined)'}"`);
    console.log(`    Last Message: "${c.lastMessage || '(none)'}"`);
    console.log(`    Updated: ${c.updatedAt}`);
    console.log(`    UnreadCount:`, JSON.stringify(c.unreadCount));
  });
  
  await client.close();
}

checkDetailed().catch(console.error);
