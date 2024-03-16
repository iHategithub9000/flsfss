var connectionCnt = 0;
module.exports = function(req, res, password, next) {
  if (require("./config.json")["log"]) {
    connectionCnt++;
    console.log(require("./config.json")["server-texts"]["log.connection.first"] + connectionCnt + ": " + req.method + " " + req.url + require("./config.json")["server-texts"]["log.connection.second"] + req.get('User-Agent') + require("./config.json")["server-texts"]["log.connection.third"] + req.headers.origin)
  }
  if (require("./config.json")["restrict-origin"]) {
    // if not visited in browser then check if origin is allowed, if it is restrict methods to POST and GET
    if (req.headers.origin && (req.headers.origin === require("./config.json")["allowed-origin"])) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE');
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', "*");
  }
  if (require("./config.json")["password-enabled"]) {
    if (!req.query.auth) {
      res.json({
        state: {
          err: true,
          errtext: require("./config.json")["server-texts"]["error.password.notprovided"]
        }
      })
      return
    }
    if (req.query.auth != password) {
      res.json({
        state: {
          err: true,
          errtext: require("./config.json")["server-texts"]["error.password.incorrect"]
        }
      })
      return
    }
  }

  for (const key in req.query) {
    if (req.query.hasOwnProperty(key) && req.query[key].length > require("./config.json")["max-query-param-length"]) {
      delete req.query[key];
      if (require("./config.json")["log"]) console.log(require("./config.json")["server-texts"]["log.query.maxexceeded"])
    }
  }

  next()
}