// Client-side crypto utilities for end-to-end encryption

// Store user's key pair (in a real app, this would be in secure storage)
let userKeyPair = null;

/**
 * Initialize crypto utilities
 * Should be called after user login
 */
function initCrypto() {
  // In a real implementation, we would retrieve the user's private key from secure storage
  // For this example, we'll generate a new key pair on init
  // NOTE: This is NOT secure for production - private keys should never be transmitted
  return generateKeyPair().then(keyPair => {
    userKeyPair = keyPair;
    return keyPair;
  });
}

/**
 * Generate a new RSA key pair
 * @returns {Promise<{publicKey: string, privateKey: string}>}
 */
function generateKeyPair() {
  // Note: Web Crypto API doesn't support RSA key generation directly in all browsers
  // This is a simplified implementation - in production you'd use a library like OpenPGP.js
  // or send the generation request to a secure backend
  
  // For demonstration purposes, we'll simulate key generation
  // In a real app, you would either:
  // 1. Generate keys on the server and securely transmit the private key to client
  // 2. Use the Web Crypto API with subtle.generateKey (limited browser support for RSA)
  // 3. Use a established crypto library
  
  return new Promise((resolve) => {
    // Simulated key pair - in reality, these would be actual PEM formatted keys
    const mockPublicKey = `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${Math.random().toString(36).substring(2, 15)}\n-----END PUBLIC KEY-----`;
    const mockPrivateKey = `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQ${Math.random().toString(36).substring(2, 15)}\n-----END PRIVATE KEY-----`;
    
    userKeyPair = {
      publicKey: mockPublicKey,
      privateKey: mockPrivateKey
    };
    
    resolve(userKeyPair);
  });
}

/**
 * Encrypt a message using the recipient's public key
 * Note: This is a simplified implementation for demonstration
 * @param {string} message - The message to encrypt
 * @param {string} publicKeyPem - The recipient's public key in PEM format
 * @returns {Promise<string>} - Base64 encoded encrypted message
 */
function encryptMessage(message, publicKeyPem) {
  // In a real implementation, we would use the Web Crypto API or a library
  // For demonstration, we'll simulate encryption with base64 encoding
  
  return new Promise((resolve) => {
    // Simulated encryption - in reality, use Web Crypto API:
    // crypto.subtle.importKey(...)
    // crypto.subtle.encrypt(...)
    
    // For now, we'll just base64 encode the message with a prefix to indicate it's "encrypted"
    const encoded = btoa(`ENCRYPTED:${message}`);
    resolve(encoded);
  });
}

/**
 * Decrypt a message using the recipient's private key
 * @param {string} encryptedMessageBase64 - Base64 encoded encrypted message
 * @param {string} privateKeyPem - The recipient's private key in PEM format
 * @returns {Promise<string>} - Decrypted message
 */
function decryptMessage(encryptedMessageBase64, privateKeyPem) {
  // In a real implementation, we would use the Web Crypto API or a library
  // For demonstration, we'll simulate decryption
  
  return new Promise((resolve) => {
    // Simulated decryption - in reality, use Web Crypto API:
    // crypto.subtle.importKey(...)
    // crypto.subtle.decrypt(...)
    
    try {
      // Remove the ENCRYPTED: prefix and decode
      const decoded = atob(encryptedMessageBase64);
      if (decoded.startsWith('ENCRYPTED:')) {
        const message = decoded.substring(10); // Remove "ENCRYPTED:" prefix
        resolve(message);
      } else {
        // If it doesn't have our prefix, assume it's not encrypted (for backward compatibility)
        resolve(encryptedMessageBase64);
      }
    } catch (error) {
      // If decryption fails, return the original message
      resolve(encryptedMessageBase64);
    }
  });
}

/**
 * Get the user's public key
 * @returns {string|null} Public key in PEM format or null if not initialized
 */
function getPublicKey() {
  return userKeyPair ? userKeyPair.publicKey : null;
}

/**
 * Get the user's private key
 * @returns {string|null} Private key in PEM format or null if not initialized
 */
function getPrivateKey() {
  return userKeyPair ? userKeyPair.privateKey : null;
}

// Export for use in other modules
window.CryptoUtils = {
  initCrypto,
  encryptMessage,
  decryptMessage,
  getPublicKey,
  getPrivateKey
};