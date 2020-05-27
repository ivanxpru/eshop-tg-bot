require('dotenv').config();
const db = require('./db');

const dbURI = process.env.DB_URI;
const dbName = process.env.DB_NAME;
const dbCollection = 'users';

const getUser = (id) => new Promise((resolve, reject) => {
  const user = {};
  db.connect(dbURI, dbName, async (err) => {
    if (err) reject(err);
    const collection = db.get().collection(dbCollection);
    await collection.findOne({ id })
      .then(async (doc) => {
        if (doc == null) {
          user.id = id;
          user.verify = false;
          user.group = 'users';
          await collection.insertOne(user)
            .then(() => {
              resolve(user);
            })
            .catch(() => { reject(user); });
        } else {
          user.id = doc.id;
          user.verify = doc.verify;
          user.group = doc.group;
          resolve(user);
        }
      })
      .catch(() => { reject(); });
  });
});

module.exports = getUser;
