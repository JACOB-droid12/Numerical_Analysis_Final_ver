const http = require("http");
const fs = require("fs");
const path = require("path");

const HOST = "0.0.0.0";
const PORT = 4173;
const root = process.cwd();
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8"
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (urlPath === "/") {
    urlPath = "/index.html";
  }
  const filePath = path.join(root, urlPath);
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }
    res.setHeader("Content-Type", mime[path.extname(filePath)] || "text/plain; charset=utf-8");
    res.end(data);
  });
}).listen(PORT, HOST, () => {
  console.log("Static server ready on http://127.0.0.1:" + PORT);
  console.log("For Playwright MCP, open the host-machine IP on port " + PORT + ".");
});
