import { createServer } from 'node:http';
import path from 'node:path';
import { readFileSync } from 'node:fs';

function writeFileToResponse(res, fileName, mimeType, encoding) {
    try {
        let options = {};
        if (encoding) {
            options.encoding = encoding;
        }
        const fileContents = readFileSync(fileName, options);
        res
            .writeHead(200, {
                'Content-Type': mimeType,
                'Content-Length': Buffer.byteLength(fileContents)
            })
            .end(fileContents);
    } catch (e) {
        console.error(`Error loading "${fileName}": ${e}`);
        res.writeHead(404, 'Not Found').end();
    }
}

const server = createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    console.log(import.meta.url);
    const fileName = path.join(import.meta.url.replace(/^file:\/\/\//, '').replace('serve.mjs', ''), url.pathname);
    const ext = path.extname(url.pathname);
    const isFileNameRequest = ext !== '';
    if (isFileNameRequest) {
        switch (ext.toLowerCase()) {
            case '.htm':
            case '.html':
                writeFileToResponse(res, fileName, 'text/html;charset=utf-8', 'utf-8');
                break;
            case '.js':
            case '.mjs':
                writeFileToResponse(res, fileName, 'text/javascript;charset=utf-8', 'utf-8');
                break;
            case '.css':
                writeFileToResponse(res, fileName, 'text/css;charset=utf-8', 'utf-8');
                break;
            case '.json':
                writeFileToResponse(res, fileName, 'application/json;charset=utf-8', 'utf-8');
                break;
        }
    }
});
server.listen(4321);
console.log(`Listening on http://localhost:4321/`);