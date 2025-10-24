
"use client"

// Helper function to convert buffer to base64
function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper function to convert base64 to buffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derives a key from a password using PBKDF2
async function getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(salt).buffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypts data using AES-GCM
export async function encryptData(data: object, password: string): Promise<string> {
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await getKey(password, salt);
    const enc = new TextEncoder();
    const encodedData = enc.encode(JSON.stringify(data));

    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encodedData
    );

    const encryptedPackage = {
      salt: bufferToBase64(salt.buffer),
      iv: bufferToBase64(iv.buffer),
      content: bufferToBase64(encryptedContent),
    };

    return JSON.stringify(encryptedPackage);
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Could not encrypt data.");
  }
}

// Decrypts data using AES-GCM
export async function decryptData(encryptedString: string, password: string): Promise<object> {
    try {
        const { salt: saltB64, iv: ivB64, content: contentB64 } = JSON.parse(encryptedString);

        const salt = base64ToBuffer(saltB64);
        const iv = base64ToBuffer(ivB64);
        const content = base64ToBuffer(contentB64);

        const key = await getKey(password, new Uint8Array(salt));

        const decryptedContent = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            key,
            content
        );

        const dec = new TextDecoder();
        const decryptedData = dec.decode(decryptedContent);
        return JSON.parse(decryptedData);

    } catch (error) {
        console.error("Decryption failed:", error);
        throw new Error("Decryption failed. Incorrect password or corrupted file.");
    }
}
