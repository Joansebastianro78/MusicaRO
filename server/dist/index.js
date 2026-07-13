"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const playlist_1 = require("./data/playlist");
const app = (0, express_1.default)();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use((0, cors_1.default)({
    origin: CLIENT_ORIGIN
}));
app.use(express_1.default.json());
app.get('/api/playlist', (_req, res) => {
    res.json(playlist_1.playlist);
});
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.listen(PORT, () => {
    console.log(`🎵 API listening on http://localhost:${PORT}`);
    console.log(`   CORS allowed origin: ${CLIENT_ORIGIN}`);
});
