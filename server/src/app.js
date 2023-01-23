const fs = require("fs");
const path = require("path");

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const app = express();

const db = require("./db");

const favourites = require("./routes/favourites");
const friends = require("./routes/friends");
const login = require("./routes/login");
const register = require("./routes/register");
const users = require("./routes/users");
const watchlist = require("./routes/watchlist");

function read(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(
      file,
      {
        encoding: "utf-8",
      },
      (error, data) => {
        if (error) return reject(error);
        resolve(data);
      }
    );
  });
}

module.exports = (ENV) => {
  app.use(cors());
  app.use(helmet());
  app.use(express.json());

  app.use("/api", friends(db));
  app.use("/api", login(db));
  app.use("/api", favourites(db));
  app.use("/api", register(db));
  app.use("/api", users(db));
  app.use("/api", watchlist(db));

  if (ENV === "development") {
    Promise.all([
      read(path.resolve(__dirname, `db/schema/01_schema.sql`)),
      read(path.resolve(__dirname, `db/seeds/01_seeds.sql`)),
    ])
      .then(([create, seed]) => {
        app.get("/api/debug/reset", (request, response) => {
          db.query(create)
            .then(() => db.query(seed))
            .then(() => {
              console.log("Database Reset");
              response.status(200).send("Database Reset");
            });
        });
      })
      .catch((error) => {
        console.log(`Error setting up the reset route: ${error}`);
      });
  }

  app.close = () => {
    return db.end();
  };

  return app;
};
