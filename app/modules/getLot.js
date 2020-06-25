require('dotenv').config();
const { ObjectId } = require('mongodb').ObjectID;
const db = require('./db');

const dbURI = process.env.DB_URI;
const dbName = process.env.DB_NAME;
const dbCollection = 'lots';

exports.add = (data) =>
  new Promise((resolve, reject) => {
    db.connect(dbURI, dbName, async (err) => {
      if (err) return console.error(err);
      const collection = db.get().collection(dbCollection);
      await collection
        .insertOne(data)
        .then((res) => {
          resolve(res.insertedId);
        })
        .catch(() => {
          reject(new Error(data));
        });
    });
  });

exports.getByLotId = (lot_id) =>
  new Promise((resolve, reject) => {
    db.connect(dbURI, dbName, async (err) => {
      if (err) reject(err);
      const collection = db.get().collection(dbCollection);
      const details = { _id: ObjectId(lot_id) };
      await collection.findOne(details, (error, result) => {
        if (error) {
          console.log(error);
          reject(err);
        }
        resolve(result);
      });
    });
  });

exports.getByUserId = (user_id, status) =>
  new Promise((resolve, reject) => {
    db.connect(dbURI, dbName, async (err) => {
      if (err) return console.error(err);
      let details;
      const collection = db.get().collection(dbCollection);
      if (!status) {
        details = { user_id };
      } else {
        details = { user_id, status };
      }
      await collection.find(details).toArray((error, result) => {
        if (err) {
          console.log(error);
          reject();
        }
        if (result.length) {
          resolve(result);
        } else {
          reject();
        }
      });
    });
  });

exports.getByFsId = (fs_id) =>
  new Promise((resolve, reject) => {
    db.connect(dbURI, dbName, async (err) => {
      if (err) return console.error(err);
      const collection = db.get().collection(dbCollection);
      const details = { fs_id };
      await collection.find(details).toArray((error, result) => {
        if (error) {
          console.log(err);
          reject();
        }
        if (result.length) {
          resolve(result);
        } else {
          reject();
        }
      });
    });
  });

exports.changeStatus = (lot_id, status) =>
  new Promise((resolve, reject) => {
    db.connect(dbURI, dbName, async (err) => {
      if (err) reject(err);
      const collection = db.get().collection(dbCollection);
      const details = { _id: ObjectId(lot_id) };
      try {
        await collection.updateOne(details, { $set: { status } });
        resolve(true);
      } catch {
        reject(new Error('changeStatus'));
      }
    });
  });
