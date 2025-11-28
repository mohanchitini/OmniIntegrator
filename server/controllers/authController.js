const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const authController = {
  getTrelloAuthUrl: (req, res) => {
    try {
      // Always use HTTPS for Replit
      const host = req.get('host');
      const baseUrl = `https://${host}`;
      
      const authUrl = `https://trello.com/1/authorize?expiration=never&name=TrelloCliqIntegrator&scope=read,write&response_type=token&key=${process.env.TRELLO_CLIENT_ID}&return_url=${encodeURIComponent(baseUrl)}`;
      
      logger.info('Trello auth URL generated', { baseUrl });
      res.json({ authUrl });
    } catch (error) {
      logger.error('Error generating Trello auth URL:', error.message);
      res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  },

  handleTrelloCallback: async (req, res) => {
    try {
      // Extract token from request body (sent by client-side callback handler)
      const trelloToken = req.body.token;
      
      logger.info('Trello callback received', { token: trelloToken ? 'present' : 'missing' });
      
      if (!trelloToken) {
        logger.error('Token is missing from Trello callback');
        return res.status(400).json({ error: 'Token is required but was not provided by Trello' });
      }

      // Create or get user
      let user = await prisma.user.create({
        data: {
          email: `user_${Date.now()}@trello-cliq.local`,
          name: 'Trello User'
        }
      });

      // Save Trello token
      await prisma.trelloToken.create({
        data: {
          userId: user.id,
          accessToken: trelloToken,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      });

      // Generate JWT token
      const jwtToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      logger.info(`Trello authentication successful for user ${user.id}`);
      
      return res.json({
        success: true,
        userId: user.id,
        token: jwtToken,
        message: 'Trello connected successfully'
      });
    } catch (error) {
      logger.error('Error handling Trello callback:', error.message);
      res.status(500).json({ error: error.message });
    }
  },

  getCliqAuthUrl: (req, res) => {
    try {
      const scope = 'ZohoCliq.Webhooks.CREATE,ZohoCliq.Bots.READ,ZohoCliq.Messages.CREATE';
      const authUrl = `https://accounts.zoho.com/oauth/v2/auth?scope=${scope}&client_id=${process.env.CLIQ_CLIENT_ID}&response_type=code&access_type=offline&redirect_uri=${process.env.CLIQ_REDIRECT_URL}`;
      
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

      const tokenResponse = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
        params: {
          code,
          client_id: process.env.CLIQ_CLIENT_ID,
          client_secret: process.env.CLIQ_CLIENT_SECRET,
          redirect_uri: process.env.CLIQ_REDIRECT_URL,
          grant_type: 'authorization_code'
        }
      });

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
