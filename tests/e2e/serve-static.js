const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const rootDir = path.resolve(__dirname, "../..");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mp4", "video/mp4"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"],
]);

function sendNotFound(response) {
  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end("Not found");
}

function sendFile(filePath, request, response) {
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      sendNotFound(response);
      return;
    }

    const contentType = mimeTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
    const headers = {
      "accept-ranges": "bytes",
      "content-type": contentType,
      "content-length": stats.size,
      "cache-control": "no-store",
    };

    const range = request.headers.range;

    if (range) {
      const [startValue, endValue] = range.replace("bytes=", "").split("-");
      const start = Number.parseInt(startValue, 10);
      const end = endValue ? Number.parseInt(endValue, 10) : stats.size - 1;

      if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= stats.size) {
        response.writeHead(416, {
          "content-range": `bytes */${stats.size}`,
        });
        response.end();
        return;
      }

      response.writeHead(206, {
        ...headers,
        "content-length": end - start + 1,
        "content-range": `bytes ${start}-${end}/${stats.size}`,
      });

      if (request.method === "HEAD") {
        response.end();
        return;
      }

      fs.createReadStream(filePath, { start, end }).pipe(response);
      return;
    }

    response.writeHead(200, headers);

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    fs.createReadStream(filePath).pipe(response);
  });
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${host}:${port}`);
  const pathname = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const normalizedPath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.resolve(rootDir, `.${normalizedPath}`);

  if (!filePath.startsWith(rootDir)) {
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  if (pathname === "/favicon.ico" && !fs.existsSync(filePath)) {
    response.writeHead(204);
    response.end();
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (!statError && stats.isFile()) {
      sendFile(filePath, request, response);
      return;
    }

    if (
      (request.method === "GET" || request.method === "HEAD") &&
      !path.extname(pathname)
    ) {
      sendFile(path.join(rootDir, "index.html"), request, response);
      return;
    }

    sendNotFound(response);
  });
});

server.listen(port, host, () => {
  process.stdout.write(`VMPix V3 static test server: http://${host}:${port}\n`);
});
