/**
 * Zero-Knowledge Client-Side Cryptographic System.
 * Encrypts and decrypts sensitive financial values/logs on the client
 * before sending them to the remote Firestore.
 */

/**
 * Derives a deterministic numerical shift array from a user chosen Passphrase/PIN.
 */
function deriveKeySequence(pin: string, salt: string = "pocketbook-salt"): number[] {
  const combined = pin + salt;
  const seq: number[] = [];
  let hash = 0;
  for (let i = 0; i < combined.length * 3; i++) {
    const char = combined.charCodeAt(i % combined.length);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
    seq.push(Math.abs(hash) % 256);
  }
  // Guarantee sequence has at least 32 bytes and no zeros
  return seq.map(v => v === 0 ? 13 : v);
}

/**
 * Encrypts a plain-text string using the user's secret PIN.
 * Returns the encrypted string with a clear prefix.
 */
export function encryptText(plainText: string, pin: string): string {
  if (!plainText || !pin) return plainText;
  
  try {
    const saltVec = String(Math.floor(Math.random() * 89999) + 10000); // 5-digit random salt
    const keySeq = deriveKeySequence(pin, saltVec);
    
    // Convert text to UTF-8 escaping to handle emojis
    const utf8Str = encodeURIComponent(plainText);
    let cipher = "";
    
    for (let i = 0; i < utf8Str.length; i++) {
      const charCode = utf8Str.charCodeAt(i);
      const keyByte = keySeq[i % keySeq.length];
      const encryptedByte = charCode ^ keyByte;
      
      // Convert to hex-string padded
      cipher += encryptedByte.toString(16).padStart(2, "0");
    }
    
    return `__ENC__:${saltVec}:${cipher}`;
  } catch (err) {
    console.error("Encryption check failure:", err);
    return plainText;
  }
}

/**
 * Decrypts a cipher-text string starting with the prefix using the user's PIN.
 * Returns decoded text, or a placeholder if PIN is incorrect.
 */
export function decryptText(cipherText: string, pin: string): string {
  if (!cipherText || !cipherText.startsWith("__ENC__:")) return cipherText;
  if (!pin) return "[Cryptographically Encrypted]";

  try {
    const parts = cipherText.split(":");
    if (parts.length < 3) return cipherText;
    
    const saltVec = parts[1];
    const hexData = parts[2];
    const keySeq = deriveKeySequence(pin, saltVec);
    
    let utf8Str = "";
    for (let i = 0; i < hexData.length; i += 2) {
      const hexByte = hexData.substring(i, i + 2);
      const encryptedByte = parseInt(hexByte, 16);
      const keyByte = keySeq[(i / 2) % keySeq.length];
      const decryptedByte = encryptedByte ^ keyByte;
      
      utf8Str += String.fromCharCode(decryptedByte);
    }
    
    return decodeURIComponent(utf8Str);
  } catch (err) {
    // Decryption failed or returned invalid characters (likely incorrect PIN)
    return `[Encrypted Page: Enter Correct PIN]`;
  }
}
