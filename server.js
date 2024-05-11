const express = require('express');
const fs = require('fs');
const LZUTF8 = require('lzutf8');
const app = express();
const PORT = require("./config.json")["port"];
const clc = require("cli-color");
const error = clc.red.bold;
const warn = clc.yellow.bold;
const info = clc.blue;
const debug = clc.magenta;


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
  if (require("./config.json")["disable-twodot"]&&req.query.filename.includes("..")){
    res.status(200).json({
          "state": {
            "err": false,
            "errtext": null
          },
          "content": "nuh uh"
        })
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
        if (require("./config.json")["log"]) console.log(debug(req.query.filename + require("./config.json")["server-texts"]["log.file.read.end"]))
      }
      if (require("./config.json")["enable-compression"]) {
        res.status(200).json({
          "state": {
            "err": false,
            "errtext": null
          },
          "content": LZUTF8.decompress(new Uint8Array(LZUTF8.decompress(data,{inputEncoding:"StorageBinaryString"}).split(',')))
        })
      } else {
        res.status(200).json({
          "state": {
            "err": false,
            "errtext": null
          },
          "content": data
        })
      }
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
      if (require("./config.json")["enable-compression"]) {
        fs.writeFile("./sharedfiles/.shared-" + name, LZUTF8.compress(LZUTF8.compress(req.query.content).toString(),{outputEncoding:"StorageBinaryString"}), (err) => {
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
            if (require("./config.json")["log"]) console.log(debug(".shared-" + name + require("./config.json")["server-texts"]["log.file.created.end"]))
          }
        });
        res.status(200).json({
          "state": {
            "err": false,
            "errtext": null
          },
          "filename": ".shared-" + name
        })
      } else {
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
            if (require("./config.json")["log"]) console.log(debug(".shared-" + name + require("./config.json")["server-texts"]["log.file.created.end"]))
          }
        });
        res.status(200).json({
          "state": {
            "err": false,
            "errtext": null
          },
          "filename": ".shared-" + name
        })
      }
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
          if (require("./config.json")["log"]) console.log(debug(req.query.filename + require("./config.json")["server-texts"]["log.file.removed.end"]))
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
  if (require("./config.json")["log"]) console.log(debug(require("./config.json")["server-texts"]["log.server.start.message.begin"] + `${PORT}`));
});
