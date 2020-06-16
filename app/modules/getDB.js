require('dotenv').config();
const delay = require('delay');
const db = require('./db');

const DB_URI = process.env.DB_URI;
const DB_NAME = process.env.DB_NAME;

exports.addEU = (data, dbCollection) =>
  new Promise((resolve, reject) => {
    (async () => {
      await db.connect(DB_URI, DB_NAME, async (err) => {
        if (err) return reject(new Error(err));
        const collection = db.get().collection(dbCollection);
        collection.findOne({ fs_id: data.fs_id }, async (_err, doc) => {
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
    })();
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
