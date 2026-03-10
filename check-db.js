import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://rawatayushh412_db_user:rxz12NL3RBdGfjUx@yappchat.lrrxtcj.mongodb.net/yapp-chat?retryWrites=true&w=majority&ssl=true';

async function check() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('yapp-chat');
  
  const convos = await db.collection('conversations').find({}).toArray();
  console.log('\n=== CONVERSATIONS IN DATABASE ===');
  console.log('Total conversations:', convos.length);
  
  convos.forEach((c, i) => {
    console.log(`\n[${i}] ID: ${c._id}`);
    console.log(`    Participants: [${c.participants.join(', ')}]`);
    console.log(`    Last Message: "${c.lastMessage || '(none)'}"`);
    console.log(`    Updated: ${c.updatedAt}`);
  });
  
  const users = await db.collection('users').find({}).toArray();
  console.log('\n=== USERS IN DATABASE ===');
  console.log('Total users:', users.length);
  users.forEach((u, i) => {
    console.log(`\n[${i}] Clerk ID: ${u.clerkId}`);
    console.log(`    Username: ${u.username}`);
    console.log(`    Email: ${u.email}`);
  });
  
  await client.close();
}

check().catch(console.error);
