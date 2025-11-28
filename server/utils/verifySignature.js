const crypto = require('crypto');

function verifyZohoCliqSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const calculatedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}

function verifyTrelloWebhook(body, signature, secret) {
  const content = JSON.stringify(body) + secret;
  const hash = crypto.createHash('sha1').update(content).digest('base64');
  return hash === signature;
}

module.exports = {
  verifyZohoCliqSignature,
  verifyTrelloWebhook
};
