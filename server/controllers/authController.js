const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const authController = {
  getTrelloAuthUrl: (req, res) => {
    try {
      // Use production backend URL for Trello callbacks
      const baseUrl = process.env.BACKEND_URL || 'https://trello-cliq-backend.onrender.com';
      const callbackUrl = `${baseUrl}/trello-callback.html`;
      
      const authUrl = `https://trello.com/1/authorize?expiration=never&name=TrelloCliqIntegrator&scope=read,write&response_type=token&key=${process.env.TRELLO_CLIENT_ID}&return_url=${encodeURIComponent(callbackUrl)}`;
      
      logger.info('Trello auth URL generated', { callbackUrl });
      res.json({ authUrl });
    } catch (error) {
      logger.error('Error generating Trello auth URL:', error.message);
      res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  },

  handleTrelloCallback: async (req, res) => {
    try {
      const trelloToken = req.body.token;
      
      if (!trelloToken) {
        logger.error('Token missing');
        return res.status(400).json({ error: 'Token required' });
      }

      // Get user info from Trello API using token
      logger.info('Fetching user info from Trello...');
      const trelloUserResponse = await axios.get('https://api.trello.com/1/members/me', {
        params: { token: trelloToken }
      });

      const trelloUser = trelloUserResponse.data;
      const userEmail = (trelloUser.email || `trello-${trelloUser.id}@trello.local`).toLowerCase().trim();

      logger.info('Got Trello user', { email: userEmail, id: trelloUser.id });

      // Find or create user
      let user = await prisma.user.findFirst({
        where: { email: userEmail }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: userEmail,
            name: trelloUser.fullName || 'Trello User'
          }
        });
        logger.info(`Created user: ${user.id}`);
      }

      // Save token
      await prisma.trelloToken.create({
        data: {
          userId: user.id,
          accessToken: trelloToken
        }
      });
      logger.info(`✅ Token saved for user ${user.id}`);

      // Generate JWT
      const jwtToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        success: true,
        userId: user.id,
        token: jwtToken,
        message: 'Connected!'
      });
    } catch (error) {
      logger.error('Callback error:', error.message);
      res.status(500).json({ error: error.message });
    }
  },

  getCliqAuthUrl: (req, res) => {
    try {
      const scope = 'ZohoCliq.Webhooks.CREATE,ZohoCliq.Bots.READ,ZohoCliq.Messages.CREATE';
      const authUrl = `https://accounts.zoho.in/oauth/v2/auth?scope=${scope}&client_id=${process.env.CLIQ_CLIENT_ID}&response_type=code&access_type=offline&redirect_uri=${process.env.CLIQ_REDIRECT_URL}`;
      
      res.json({ authUrl });
    } catch (error) {
      logger.error('Error generating Cliq auth URL:', error.message);
      res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  },

  handleCliqCallback: async (req, res) => {
    try {
      // Extract code from query params (GET) or body (POST)
      const code = req.method === 'GET' ? req.query.code : req.body.code;
      const userId = req.method === 'GET' ? req.query.userId : req.body.userId;
      
      logger.info('Cliq callback received', { code: code ? 'present' : 'missing', method: req.method });
      
      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      // Debug: Log credentials being used (without exposing full secret)
      const clientId = process.env.CLIQ_CLIENT_ID?.trim();
      const clientSecret = process.env.CLIQ_CLIENT_SECRET?.trim();
      const redirectUrl = process.env.CLIQ_REDIRECT_URL?.trim();
      
      logger.info('Zoho token request', { 
        client_id: clientId ? 'present' : 'missing',
        client_secret: clientSecret ? 'present' : 'missing', 
        redirect_uri: redirectUrl,
        grant_type: 'authorization_code'
      });

      const tokenResponse = await axios.post('https://accounts.zoho.in/oauth/v2/token', 
        `code=${code}&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(redirectUrl)}&grant_type=authorization_code`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      logger.info('Zoho token response received', { status: tokenResponse.status, keys: Object.keys(tokenResponse.data) });
      
      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      
      if (!access_token) {
        logger.error('No access_token in Zoho response', { response: tokenResponse.data });
        throw new Error('Zoho did not return an access token - check your credentials and redirect URL');
      }

      let user;
      if (userId) {
        user = await prisma.user.findUnique({ where: { id: userId } });
      } else {
        user = await prisma.user.create({
          data: {
            email: `user_${Date.now()}@trello-cliq.local`,
            name: 'Cliq User'
          }
        });
      }

      // Calculate expiration date (default to 24 hours if not provided)
      const expiresInSeconds = expires_in || 86400;
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

      await prisma.cliqToken.create({
        data: {
          userId: user.id,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt
        }
      });

      const jwtToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      logger.info(`Cliq authentication successful for user ${user.id}`);
      
      res.json({
        success: true,
        userId: user.id,
        token: jwtToken
      });
    } catch (error) {
      logger.error('Error handling Cliq callback:', error.message);
      res.status(500).json({ error: 'Authentication failed' });
    }
  },

  verifyToken: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        valid: true,
        userId: user.id,
        email: user.email
      });
    } catch (error) {
      logger.error('Error verifying token:', error.message);
      res.status(401).json({ error: 'Invalid token' });
    }
  }
};

module.exports = authController;
