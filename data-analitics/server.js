const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

class VehicleCatalogServer {
    constructor() {
        this.port = 3111;
        this.server = null;
    }

    start() {
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        this.server.listen(this.port, () => {
            console.log(`🚀 Vehicle Catalog Viewer running at http://localhost:${this.port}`);
            console.log('📊 Open the URL in your browser to review the vehicle data');
        });
    }

    handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        let pathname = parsedUrl.pathname;

        // Serve static files
        if (pathname === '/') {
            pathname = '/index.html';
        }

        const filePath = path.join(__dirname, 'public', pathname);

        // Check if file exists
        if (fs.existsSync(filePath)) {
            this.serveFile(filePath, res);
        } else {
            this.serve404(res);
        }
    }

    serveFile(filePath, res) {
        const ext = path.extname(filePath);
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';

        fs.readFile(filePath, (error, content) => {
            if (error) {
                this.serve500(res, error);
                return;
            }

            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            res.end(content, 'utf-8');
        });
    }

    serve404(res) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
            <html>
                <head><title>404 - Not Found</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>404 - Page Not Found</h1>
                    <p>The requested file could not be found.</p>
                    <p><a href="/">← Back to Vehicle Catalog</a></p>
                </body>
            </html>
        `);
    }

    serve500(res, error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`
            <html>
                <head><title>500 - Server Error</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>500 - Server Error</h1>
                    <p>An internal server error occurred.</p>
                    <p><a href="/">← Back to Vehicle Catalog</a></p>
                </body>
            </html>
        `);
    }

    stop() {
        if (this.server) {
            this.server.close(() => {
                console.log('✅ Server stopped');
            });
        }
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    server.stop();
    process.exit(0);
});

// Start the server
const server = new VehicleCatalogServer();
server.start();
