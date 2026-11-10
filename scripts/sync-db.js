const mongoose = require('../server/node_modules/mongoose');

async function sync() {
  console.log('Connecting to source (27018) and destination (27017)...');
  const connFrom = await mongoose.createConnection('mongodb://127.0.0.1:27018/clinic-management').asPromise();
  const connTo = await mongoose.createConnection('mongodb://127.0.0.1:27017/clinic-management').asPromise();

  const collections = await connFrom.db.listCollections().toArray();
  console.log('Collections to copy:', collections.map(c => c.name));

  for (const col of collections) {
    const docs = await connFrom.collection(col.name).find().toArray();
    if (docs.length > 0) {
      console.log(`Copying ${docs.length} docs from ${col.name}...`);
      for (const doc of docs) {
        await connTo.collection(col.name).replaceOne(
          { _id: doc._id },
          doc,
          { upsert: true }
        );
      }
    }
  }

  const userCount = await connTo.collection('users').countDocuments();
  console.log('Sync complete! Total users in port 27017:', userCount);
  await connFrom.close();
  await connTo.close();
}

sync().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

