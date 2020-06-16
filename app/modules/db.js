const MongoClient = require('mongodb').MongoClient;

const state = {
  db: null,
};

let dbClient;

exports.connect = (dbURL, dbName, done) => {
  if (state.db) {
    console.log(state);
  }
  if (state.db) return done();
  const mongoClient = new MongoClient(dbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  mongoClient.connect((err, db) => {
    if (err) return done(err);
    dbClient = db;
    state.db = db.db(dbName);
    done();
  });
};

exports.get = () => state.db;

exports.close = () => {
  dbClient.close();
  state.db = null;
};
