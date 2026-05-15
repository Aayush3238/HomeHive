// Crypto utilities for end-to-end encryption
const crypto = require('crypto');

/**
 * Generate a new RSA key pair
 * @returns {Promise<{publicKey: string, privateKey: string}>}
 */
function generateKeyPair() {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    }, (err, publicKey, privateKey) => {
      if (err) {
        reject(err);
      } else {
        resolve({ publicKey, privateKey });
      }
    });
  });
}

/**
 * Encrypt a message using the recipient's public key
 * @param {string} message - The message to encrypt
 * @param {string} publicKeyPem - The recipient's public key in PEM format
 * @returns {Promise<string>} - Base64 encoded encrypted message
 */
function encryptMessage(message, publicKeyPem) {
  return new Promise((resolve, reject) => {
    const buffer = Buffer.from(message, 'utf8');
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      buffer
    );
    resolve(encrypted.toString('base64'));
  });
}

/**
 * Decrypt a message using the recipient's private key
 * @param {string} encryptedMessageBase64 - Base64 encoded encrypted message
 * @param {string} privateKeyPem - The recipient's private key in PEM format
 * @returns {Promise<string>} - Decrypted message
 */
function decryptMessage(encryptedMessageBase64, privateKeyPem) {
  return new Promise((resolve, reject) => {
    const encryptedBuffer = Buffer.from(encryptedMessageBase64, 'base64');
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      encryptedBuffer
    );
    resolve(decrypted.toString('utf8'));
  });
}

module.exports = {
  generateKeyPair,
  encryptMessage,
  decryptMessage
};