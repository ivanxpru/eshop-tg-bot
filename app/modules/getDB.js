require('dotenv').config();
const delay = require('delay');
const db = require('./db');

const DB_URI = process.env.DB_URI;
const DB_NAME = process.env.DB_NAME;

exports.findEU = (fs_ids, dbCollection) =>
  new Promise((resolve, reject) => {
    db.connect(DB_URI, DB_NAME, (err_connect) => {
      if (err_connect) return reject(err_connect);
      const collection = db.get().collection(dbCollection);
      if (Array.isArray(fs_ids)) {
        const query = `{ fs_id: {$in: ${fs_ids}}`;
        collection.find(query).toArray((err_find, docs) => {
          if (err_find) return reject(err_find);
          if (docs === null) {
            db.close();
            return reject();
          }
          db.close();
          return resolve(docs);
        });
      } else {
        collection.findOne({ fs_id: fs_ids }, (err_findOne, doc) => {
          if (err_findOne) return reject(err_findOne);
          if (doc === null) {
            db.close();
            return reject();
          }
          db.close();
          return resolve(doc);
        });
      }
    });
  });

exports.findUS = (objectIDs, dbCollection) =>
  new Promise((resolve, reject) => {
    db.connect(DB_URI, DB_NAME, (err) => {
      if (err) return reject(new Error(err));
      const collection = db.get().collection(dbCollection);
      if (Array.isArray(objectIDs)) {
        const query = `{ objectID: {$in: ${objectIDs}}`;
        collection.find(query).toArray((err_find, docs) => {
          if (err_find) return reject(err_find);
          if (docs === null) {
            db.close();
            return reject();
          }
          db.close();
          return resolve(docs);
        });
      } else {
        collection.findOne({ objectID: objectIDs }, (err_findOne, doc) => {
          if (err) return reject(new Error(err_findOne));
          if (doc === null) {
            db.close();
            return reject();
          }
          db.close();
          return resolve(doc);
        });
      }
    });
  });

exports.addEU = (data, dbCollection) =>
  new Promise((resolve, reject) => {
    db.connect(DB_URI, DB_NAME, async (err) => {
      if (err) return reject(new Error(err));
      const collection = db.get().collection(dbCollection);
      collection.findOne({ fs_id: data.fs_id }, (_err, doc) => {
        if (doc === null) {
          collection.insertOne(data, async (err_insertOne, _result) => {
            if (err_insertOne) {
              return reject(new Error(err_insertOne));
            }
            db.close();
            return resolve();
          });
        } else {
          db.close();
          return reject(new Error(doc));
        }
      });
    });
  });

exports.addUS = (data, dbCollection) =>
  new Promise((resolve, reject) => {
    (async () => {
      await db.connect(DB_URI, DB_NAME, async (err) => {
        if (err) return reject(new Error(err));
        const collection = db.get().collection(dbCollection);
        await collection.findOne(
          { objectID: data.objectID },
          async (_err, doc) => {
            if (doc === null) {
              await collection.insertOne(
                data,
                async (err_insertOne, _result) => {
                  if (err_insertOne) {
                    return reject(new Error(err));
                  }
                  await delay(1000);
                  db.close();
                  return resolve();
                },
              );
            } else {
              await delay(1000);
              db.close();
              return reject(new Error(doc));
            }
          },
        );
      });
    })();
  });

exports.updateEU = (fs_id, update, dbCollection) =>
  new Promise((resolve, reject) => {
    (async () => {
      await db.connect(DB_URI, DB_NAME, async (err_connect) => {
        if (err_connect) return reject(err_connect);
        const collection = db.get().collection(dbCollection);
        await collection
          .updateOne({ fs_id }, { $set: update })
          .then(() => {
            resolve();
          })
          .catch((err_update) => {
            reject(err_update);
          });
      });
    })();
  });

exports.updateUS = (objectID, update, dbCollection) =>
  new Promise((resolve, reject) => {
    (async () => {
      await db.connect(DB_URI, DB_NAME, async (err_connect) => {
        if (err_connect) return reject(err_connect);
        const collection = db.get().collection(dbCollection);
        await collection
          .updateOne({ objectID }, { $set: update })
          .then(() => {
            resolve();
          })
          .catch((err_update) => {
            reject(err_update);
          });
      });
    })();
  });
