const express = require('express');
const axios = require('axios');

const router = express.Router();

function mapGifResponse(item = {}) {
    const images = item.images || {};
    const original = images.original || {};
    const downsizedLarge = images.downsized_large || {};
    const fixedWidthSmall = images.fixed_width_small || {};
    const downsizedStill = images.downsized_still || {};
    const originalStill = images.original_still || {};

    return {
        id: item.id,
        title: item.title || 'GIF',
        url: original.url || downsizedLarge.url || item.url,
        preview: fixedWidthSmall.url || downsizedStill.url || originalStill.url || original.url,
        width: Number(original.width) || null,
        height: Number(original.height) || null
    };
}

router.get('/gifs/search', async (req, res) => {
    const query = (req.query.q || '').trim();
    if (!query) {
        return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const apiKey = process.env.GIPHY_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ success: false, message: 'GIPHY_API_KEY is not configured' });
    }

    try {
        const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
            params: {
                api_key: apiKey,
                q: query,
                limit: Number(req.query.limit) || 16,
                rating: req.query.rating || 'pg-13',
                lang: req.query.lang || 'en'
            },
            timeout: 8000
        });

        const gifs = Array.isArray(response.data?.data)
            ? response.data.data.map(mapGifResponse).filter(gif => gif.url)
            : [];

        return res.json({ success: true, gifs });
    } catch (error) {
        console.error('Error fetching GIFs from Giphy:', error.response?.data || error.message);
        return res.status(502).json({ success: false, message: 'Failed to fetch GIFs. Please try again.' });
    }
});

router.get('/gifs/trending', async (req, res) => {
    const apiKey = process.env.GIPHY_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ success: false, message: 'GIPHY_API_KEY is not configured' });
    }

    try {
        const response = await axios.get('https://api.giphy.com/v1/gifs/trending', {
            params: {
                api_key: apiKey,
                limit: Number(req.query.limit) || 16,
                rating: req.query.rating || 'pg-13'
            },
            timeout: 8000
        });

        const gifs = Array.isArray(response.data?.data)
            ? response.data.data.map(mapGifResponse).filter(gif => gif.url)
            : [];

        return res.json({ success: true, gifs });
    } catch (error) {
        console.error('Error fetching trending GIFs from Giphy:', error.response?.data || error.message);
        return res.status(502).json({ success: false, message: 'Failed to fetch trending GIFs. Please try again.' });
    }
});

module.exports = router;
