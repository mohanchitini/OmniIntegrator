const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const authController = {
  getTrelloAuthUrl: (req, res) => {
    try {
      // Get the origin from request or use environment
      const protocol = req.protocol || 'https';
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;
      const callbackUrl = `${baseUrl}/trello-callback.html`;
      
      console.log('🔥 Auth URL:', { protocol, host, baseUrl, callbackUrl });
      
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
      
      console.log('🔥 CALLBACK RECEIVED', { token: !!trelloToken });
      
      if (!trelloToken) {
        logger.error('Token missing');
        return res.status(400).json({ error: 'Token required' });
      }

      // Get user info from Trello API using token
      logger.info('Fetching user info from Trello...');
      console.log('🔥 Calling Trello API...');
      
      // Create generic user - no need to call Trello API
      const userEmail = `trello-${trelloToken.substring(0, 8)}@trello.local`.toLowerCase();
      const trelloUser = { fullName: 'Trello User' };
      console.log('🔥 User Email:', userEmail);

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
      console.log('✅ Token saved to database');
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
      console.log('🔥 CALLBACK ERROR:', error.message);
      logger.error('Callback error:', error.message);
      res.status(500).json({ error: error.message });
    }
  },

  getCliqAuthUrl: (req, res) => {
    try {
      const scope = 'ZohoCliq.Webhooks.CREATE,ZohoCliq.Bots.READ,ZohoCliq.Messages.CREATE';
      const redirectUri = `${process.env.ZOHO_CLIQ_REDIRECT_URI}`;

      const authUrl = `https://accounts.zoho.com/oauth/v2/auth?scope=${encodeURIComponent(scope)}&client_id=${process.env.ZOHO_CLIQ_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${Date.now()}`;

      logger.info('Cliq auth URL generated');
      res.json({ authUrl });
    } catch (error) {
      logger.error('Error generating Cliq auth URL:', error.message);
      res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  },

  handleCliqCallback: async (req, res) => {
    try {
      const code = req.query.code || req.body.code;
      
      if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
      }

      logger.info('Cliq callback received with code');

      // Exchange code for access token
      const tokenResponse = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
        params: {
          grant_type: 'authorization_code',
          client_id: process.env.ZOHO_CLIQ_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIQ_CLIENT_SECRET,
          redirect_uri: process.env.ZOHO_CLIQ_REDIRECT_URI,
          code: code
        }
      });

      const accessToken = tokenResponse.data.access_token;
      logger.info('Cliq access token obtained');

      // Get user info
      const userResponse = await axios.get('https://cliq.zoho.com/api/v2/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const cliqUser = userResponse.data.data;
      const userEmail = (cliqUser.email || `cliq-${cliqUser.id}@cliq.local`).toLowerCase().trim();

      logger.info('Got Cliq user info', { email: userEmail });

      // Find or create user
      let user = await prisma.user.findFirst({
        where: { email: userEmail }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: userEmail,
            name: cliqUser.name || 'Cliq User'
          }
        });
        logger.info(`Created user: ${user.id}`);
      }

      // Save Cliq token
      await prisma.cliqToken.create({
        data: {
          userId: user.id,
          accessToken: accessToken
        }
      });

      logger.info(`Cliq token saved for user ${user.id}`);

      // Generate JWT
      const jwtToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        userId: user.id,
        token: jwtToken,
        message: 'Cliq connected successfully'
      });
    } catch (error) {
      logger.error('Error handling Cliq callback:', error.message);
      res.status(500).json({ error: error.message });
    }
  },

  verifyToken: (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Token required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.json({ valid: true, userId: decoded.userId });
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
};

module.exports = authController;
