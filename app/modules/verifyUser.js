require('dotenv').config();
const db = require('./db');

const dbURI = process.env.DB_URI;
const dbName = process.env.DB_NAME;
const dbCollection = process.env.DB_COLLECTION;

const verifyUser = (user_id, verify) =>
  new Promise((resolve, reject) => {
    db.connect(dbURI, dbName, async (err) => {
      if (err) return console.log(err);
      const collection = db.get().collection(dbCollection);
      await collection.findOne({ id: user_id }).then(async (doc) => {
        if (doc === null) {
          reject(new Error('user not found ind DB'));
        } else {
          await collection.updateOne({ id: user_id }, { $set: { verify } });
          // / await db.close();
          resolve(true);
        }
      });
    });
  });

module.exports = verifyUser;
