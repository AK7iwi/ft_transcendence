const { authenticator } = require("otplib");
const qrcode = require("qrcode");

function generateSecret(username) {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(username, "Transcendence", secret);
  return { secret, otpauth };
}

async function generateQRCode(data) {
  return await qrcode.toDataURL(data);
}

function verify2FACode(secret, token) {
  return authenticator.verify({ token, secret });
}

module.exports = {
  generateSecret,
  generateQRCode,
  verify2FACode,
};
