import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://rawatayushh412_db_user:rxz12NL3RBdGfjUx@yappchat.lrrxtcj.mongodb.net/yapp-chat?retryWrites=true&w=majority&ssl=true';

async function deleteBrokenConversation() {
 const client = new MongoClient(uri);
  await client.connect();
 const db = client.db('yapp-chat');
  
  // Find conversations with only 1 participant
 const brokenConvos = await db.collection('conversations').find({
    participants: { $size: 1 }
  }).toArray();
  
 console.log('\n=== FOUND BROKEN CONVERSATIONS ===');
 console.log('Count:', brokenConvos.length);
  
  if (brokenConvos.length > 0) {
    console.log('\nDeleting these conversations:');
    brokenConvos.forEach((c, i) => {
      console.log(`  [${i}] ${c._id} - Participants: [${c.participants.join(', ')}]`);
    });
    
    const result = await db.collection('conversations').deleteMany({
      participants: { $size: 1 }
    });
    
    console.log(`\n✅ Deleted ${result.deletedCount} broken conversation(s)`);
  } else {
    console.log('No broken conversations found!');
  }
  
  await client.close();
}

deleteBrokenConversation().catch(console.error);
