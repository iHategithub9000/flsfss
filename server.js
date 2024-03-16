const express = require('express');
const fs = require('fs');
const app = express();
const PORT = require("./config.json")["port"];

function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

app.use((req, res, next) => {
  require("./middleware.js")(req, res, require("./config.json")["password"], next);
});

app.get('/', (req, res) => {
  if (require("./config.json")["restrict-origin"])
    if (req.headers.origin) {
      res.status(403).json({
        "state": {
          "err": true,
          "errtext": require("./config.json")["server-texts"]["error.route.nopermission"]
        },
        "content": null
      });
      return;
    }
  res.status(200).send(require("./config.json")["server-texts"]["route.root"])
})

app.get('/file/read', (req, res) => {
  if (require("./config.json")["restrict-origin"])
    if (req.headers.origin !== require("./config.json")["allowed-origin"]) {
      res.status(403).json({
        "state": {
          "err": true,
          "errtext": require("./config.json")["server-texts"]["error.route.nopermission"]
        }
      });
      return;
    }
  try {
    if (!req.query.filename) throw new Error();
    fs.readFile("./sharedfiles/" + req.query.filename, 'utf8', (err, data) => {
      if (err) {
        res.status(404).json({
          "state": {
            "err": true,
            "errtext": require("./config.json")["server-texts"]["error.file.missing"]
          },
          "content": null
        })
        return;
      } else {
        if (require("./config.json")["log"]) console.log(req.query.filename + require("./config.json")["server-texts"]["log.file.read.end"])
      }
      res.status(200).json({
        "state": {
          "err": false,
          "errtext": null
        },
        "content": data
      })
    });
  } catch {
    res.status(400).json({
      "state": {
        "err": true,
        "errtext": require("./config.json")["server-texts"]["error.query.missing.filename"]
      },
      "content": null
    })
  }
});

app.post('/file/write', (req, res) => {
  if (require("./config.json")["allow-writing"]) {
    if (require("./config.json")["restrict-origin"])
      if (req.headers.origin !== require("./config.json")["allowed-origin"]) {
        res.status(403).json({
          "state": {
            "err": true,
            "errtext": require("./config.json")["server-texts"]["error.route.nopermission"]
          }
        });
        return;
      }
    try {
      let name = generateRandomString(require("./config.json")["generated-filename-length"])
      if (!req.query.content) throw new Error();
      fs.writeFile("./sharedfiles/.shared-" + name, req.query.content, (err) => {
        if (err) {
          res.status(500).json({
            "state": {
              "err": true,
              "errtext": "Internal Server Error"
            },
            "filename": null
          })
          return;
        } else {
          if (require("./config.json")["log"]) console.log(".shared-" + name + require("./config.json")["server-texts"]["log.file.created.end"])
        }
      });
      res.status(200).json({
        "state": {
          "err": false,
          "errtext": null
        },
        "filename": ".shared-" + name
      })
    } catch {
      res.status(400).json({
        "state": {
          "err": true,
          "errtext": require("./config.json")["server-texts"]["error.query.missing.content"]
        },
        "filename": null
      })
    }
  } else {
    res.status(403).json({
      "state": {
        "err": true,
        "errtext": require("./config.json")["server-texts"]["error.file.write.notallowed"]
      },
      "filename": null
    })
  }
});

app.delete('/file/remove', (req, res) => {
  if (require("./config.json")["allow-removal"]) {
    if (require("./config.json")["restrict-origin"])
      if (req.headers.origin !== require("./config.json")["allowed-origin"]) {
        res.status(403).json({
          "state": {
            "err": true,
            "errtext": require("./config.json")["server-texts"]["error.route.nopermission"]
          }
        });
        return;
      }
    try {
      if (!req.query.filename) throw new Error();
      fs.unlink("./sharedfiles/" + req.query.filename, (err) => {
        if (err) {
          res.status(404).json({
            "state": {
              "err": true,
              "errtext": require("./config.json")["server-texts"]["error.file.missing"]
            }
          })
          return;
        } else {
          if (require("./config.json")["log"]) console.log(req.query.filename + require("./config.json")["server-texts"]["log.file.removed.end"])
          res.status(200).json({
            "state": {
              "err": false,
              "errtext": null
            }
          })
        }
      });
    } catch {
      res.status(400).json({
        "state": {
          "err": true,
          "errtext": require("./config.json")["server-texts"]["error.file.missing"]
        }
      })
    }
  } else {
    res.status(403).json({
      "state": {
        "err": true,
        "errtext": require("./config.json")["server-texts"]["error.file.remove.notallowed"]
      }
    })
  }
});

app.post('*', function(req, res) {
  res.status(404).json({
    state: {
      err: true,
      errtext: require("./config.json")["server-texts"]["error.route.nonexistent"]
    }
  });
});

app.get('*', function(req, res) {
  res.status(404).json({
    state: {
      err: true,
      errtext: require("./config.json")["server-texts"]["error.route.nonexistent"]
    }
  });
});

app.listen(PORT, () => {
  if (require("./config.json")["log"]) console.log(require("./config.json")["server-texts"]["log.server.start.message.begin"] + `${PORT}`);
});