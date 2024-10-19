const express = require("express");
const { body } = require("express-validator");
const bodyParser = require("body-parser");
const cors = require("cors");
const ytcontroller = require("./controllers/ytcontroller.js");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const app = express();

const { Server } = require('socket.io'); 
const http = require('http'); 
const server = http.createServer(app); 
const io = new Server(server); 

// Set EJS as the view engine
app.set("view engine", "ejs");

// Serve static files from the "public" directory
app.use(express.static("public"));

app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cors());


// Middleware to prevent browser caching
function noCache(req, res, next) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
}
app.use(noCache);

app.get("/", (req, res) => {
    res.render("index"); 
});

app.post(
    "/transcript",
    [
        body('url')
        .notEmpty().withMessage("YouTube URL is required")
        .isURL().withMessage("Please provide a valid URL")
    ],
    ytcontroller.fetchVideoTranscript
);

app.post('/get-visitor', (req, res) => ytcontroller.visitorData(req, res, io));

io.on('connection', (socket) => {
    console.log('A client connected');
    
    // Call ytcontroller.visitorData immediately on connection
    ytcontroller.visitorData(null, null, io);

    // Set interval to call it every 5 minutes (300,000 ms)
    const visitorDataInterval = setInterval(() => {
        ytcontroller.visitorData(null, null, io);
    }, 5000);

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        // Clear the interval when the client disconnects to avoid memory leaks
        clearInterval(visitorDataInterval);
    });
});


server.listen(PORT, () => {
    console.log(`Server is runnig at port ${PORT}`);
});
  