/**
 * sink.js - tiny local HTTP sink so scraped data lands on disk without
 * being pasted through the console.
 *
 */
const http = require("http");
const fs = require("fs");

const out = process.argv[2];
const port = Number(process.argv[3] || 8787);

if (!out) {
  console.error("usage: node sink.js <target-file> [port]");
  process.exit(1);
}

http
  .createServer((req, res) => {
    if (req.method === "POST") {
      let body = "";
      req.on("data", (c) => {
        body += c;
      });
      req.on("end", () => {
        try {
          fs.appendFileSync(out, body, "utf8");
        } catch (e) {
          res.statusCode = 500;
          res.end(String(e));
          return;
        }
        res.end("OK " + body.length);
      });
    } else {
      res.end("READY");
    }
  })
  .listen(port, "127.0.0.1", () => {
    console.log("sink listening on http://127.0.0.1:" + port + " -> " + out);
  });
