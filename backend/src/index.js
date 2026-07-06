const express = require('express');
const app = express();

// Bug #6 fix: Trust the first proxy so express-rate-limit sees the real
// client IP from X-Forwarded-For instead of the proxy's IP. Without this,
// ALL users behind the same reverse proxy share a single rate-limit bucket.
// Adjust the count (1) to match your deployment's proxy chain length.
app.set('trust proxy', 1);

require('dotenv').config();

const main = require('./config/db');
const cookieParser = require('cookie-parser');
const authRouter = require("./routes/userAuth");
const googleRouter = require("./routes/googleAuth");
const engagementRouter = require("./routes/userEngagement");
const redisClient = require('./config/redis');
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit");
const aiRouter = require("./routes/aiChatting");
const videoRouter = require("./routes/videoCreator");
const discussionRouter = require("./routes/discussion");
const cors = require('cors');
const helmet = require('helmet');
const { authLimiter, oauthLimiter, aiChatLimiter } = require('./middleware/rateLimiters');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');



// Helmet — secure HTTP headers. Mounted FIRST so all responses get them.
// CSP allows:
//   - 'self' for everything by default
//   - Cloudinary video URLs (used by Editorial component) via media-src
//   - Google profile avatar URLs (used by Homepage navbar) via img-src
//   - connect-src 'self' + the API origin so the frontend's axios calls work
//     when the API is on a different host (controlled by CLIENT_URL)
// Note: the frontend is a SPA served separately, so this CSP only applies to
// the API's own HTML responses (mostly error pages). The frontend should
// ship its own CSP via a <meta> tag or its web server config.
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            mediaSrc: ["'self'", "https://res.cloudinary.com"],
            imgSrc: ["'self'", "data:", "https://lh3.googleusercontent.com", "https://res.cloudinary.com"],
            connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:5173'],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
        },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "OK",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
    console.log("REQUEST:", req.method, req.originalUrl);
    next();
});

app.use('/user', authRouter);
app.use('/user', googleRouter);
app.use('/user', engagementRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);
app.use('/ai', aiRouter);
app.use('/video', videoRouter);
app.use('/discussion', discussionRouter);

// P2-7: Centralized error handling — mounted LAST so it catches:
//   - 404s for unmatched routes (notFoundHandler)
//   - Errors forwarded via next(err) from asyncHandler-wrapped controllers
//   - Errors thrown synchronously by Express middleware
// Existing controllers that hand-write res.status().send() in their own
// try/catch are NOT affected — their responses go out before reaching here.
app.use(notFoundHandler);
app.use(errorHandler);

const InitalizeConnection = async () => {
    try {

        await Promise.all([
            main(),
            redisClient.connect()
        ]);

        console.log("DB Connected");

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log("Server listening at port number: " + PORT);
        });

    }
    catch (err) {
        console.log("Error: " + err);
    }
};

InitalizeConnection();