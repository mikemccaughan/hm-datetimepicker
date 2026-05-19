import { createServer } from 'node:http';
import path from 'node:path';
import { readFileSync } from 'node:fs';

/**
 * Writes a file to the HTTP response.
 * @param {Response} res The HTTP response object.
 * @param {string} fileName The path to the file to read.
 * @param {string} mimeType The MIME type of the file.
 * @param {string} encoding The encoding of the file.
 * @returns {void}
 */
function writeFileToResponse(res, fileName, mimeType, encoding) {
    try {
        let options = {};
        if (encoding) {
            options.encoding = encoding;
        }
        const fileContents = readFileSync(fileName, options);
        console.log(`Serving "${fileName}"...`);
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

/**
 * Gets the full path to the file specified by the given URL.
 * @param {URL} url The URL from which to get the path and filename
 * @returns {string} The full path to the file specified by the URL given.
 */
const getFileNameFromUrl = (url) => {
    return path.join(
        import.meta.url.replace(/^file:\/\/\//, '').replace('serve.mjs', ''), 
        (url.pathname?.replace(/\/$/, '')?.length ?? 0) ? url.pathname.replace(/\/$/, '') : 'index.html'
    );
}

/**
 * Creates an HTTP server that serves files based on the request URL. The server listens on port 4321.
 * The server determines the file to serve based on the request URL and serves it with the appropriate MIME type. 
 * If the file is not found, it responds with a 404 status code.
 * @returns {HttpServer} The created HTTP server instance.
 */
const server = createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let fileName = '/' + getFileNameFromUrl(url);
    let ext = path.extname(url.pathname);
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
            default:
                fileName = '/' + getFileNameFromUrl(url);
                writeFileToResponse(res, fileName, 'text/html;charset=utf-8', 'utf-8');
        }
    } else {
        console.log(`basepath: /${import.meta.url.replace(/^file:\/\/\//, '').replace('serve.mjs', '')}`);
        console.log(`pathname: /${(url.pathname?.replace(/\/$/, '')?.length ?? 0) ? url.pathname.replace(/\/$/, '') : 'index.html'}`);
        fileName = '/' + getFileNameFromUrl(url);
        console.log(`fileName: ${fileName}`);
        writeFileToResponse(res, fileName, 'text/html;charset=utf-8', 'utf-8');
    }
});
server.

console.log(`Listening on http://localhost:${port}/`);