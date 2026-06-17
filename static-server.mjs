import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT || 4173);

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".mp3", "audio/mpeg"],
  [".mp4", "video/mp4"],
  [".webm", "video/webm"],
  [".glb", "model/gltf-binary"],
]);

function resolveRequestPath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://127.0.0.1:${port}`).pathname);
  const clean = normalize(pathname).replace(/^([/\\])+/, "");
  let target = resolve(join(root, clean || "index.html"));

  if (!target.startsWith(root)) {
    return null;
  }

  const stats = statSync(target, { throwIfNoEntry: false });
  if (stats?.isDirectory()) {
    target = join(target, "index.html");
  }
  return target;
}

createServer((request, response) => {
  const target = resolveRequestPath(request.url || "/");
  const stats = target ? statSync(target, { throwIfNoEntry: false }) : null;

  if (!target || !stats?.isFile()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": types.get(extname(target).toLowerCase()) || "application/octet-stream",
    "cache-control": "no-store",
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(target).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}/`);
});
