import nacl from "tweetnacl";
import util from "tweetnacl-util";

export const generateKeys = () => {
    const keyPair = nacl.box.keyPair();
    return {
        publicKey: util.encodeBase64(keyPair.publicKey),
        secretKey: util.encodeBase64(keyPair.secretKey)
    };
};

export const encryptMessage = (message, theirPublicKeyBase64, mySecretKeyBase64) => {
    try {
        const nonce = nacl.randomBytes(nacl.box.nonceLength);
        const theirPublicKey = util.decodeBase64(theirPublicKeyBase64);
        const mySecretKey = util.decodeBase64(mySecretKeyBase64);
        const messageUint8 = util.decodeUTF8(message);

        const encrypted = nacl.box(messageUint8, nonce, theirPublicKey, mySecretKey);

        const fullMessage = new Uint8Array(nonce.length + encrypted.length);
        fullMessage.set(nonce);
        fullMessage.set(encrypted, nonce.length);

        return util.encodeBase64(fullMessage);
    } catch (e) {
        console.error("Encryption failed:", e);
        return null;
    }
};

export const decryptMessage = (encryptedMessageBase64, theirPublicKeyBase64, mySecretKeyBase64) => {
    try {
        const messageWithNonceAsUint8Array = util.decodeBase64(encryptedMessageBase64);
        const nonce = messageWithNonceAsUint8Array.slice(0, nacl.box.nonceLength);
        const message = messageWithNonceAsUint8Array.slice(nacl.box.nonceLength, messageWithNonceAsUint8Array.length);

        const theirPublicKey = util.decodeBase64(theirPublicKeyBase64);
        const mySecretKey = util.decodeBase64(mySecretKeyBase64);

        const decrypted = nacl.box.open(message, nonce, theirPublicKey, mySecretKey);

        if (!decrypted) {
            throw new Error("Could not decrypt message");
        }

        return util.encodeUTF8(decrypted);
    } catch (e) {
        console.error("Decryption failed details:", e.message, { theirPublicKeyBase64 });
        return "[Encrypted Message]";
    }
};

// Hybrid Encryption for Groups
export const encryptGroupMessage = (message, recipientPublicKeysMap, mySecretKeyBase64) => {
    try {
        // 1. Generate a random symmetric key for this message
        // shared key should be 32 bytes for xsalsa20-poly1305 (secretbox)? No, box uses Curve25519.
        // For hybrid, we usually use `nacl.secretbox` (symmetric) for content, and `nacl.box` (asymmetric) for the key.
        // `nacl.secretbox` key length is 32 bytes.

        const msgKey = nacl.randomBytes(nacl.secretbox.keyLength);
        const msgNonce = nacl.randomBytes(nacl.secretbox.nonceLength);
        const messageUint8 = util.decodeUTF8(message);

        // 2. Encrypt message with symmetric key
        const encryptedMessage = nacl.secretbox(messageUint8, msgNonce, msgKey);

        // Pack nonce + ciphertext
        const fullMessage = new Uint8Array(msgNonce.length + encryptedMessage.length);
        fullMessage.set(msgNonce);
        fullMessage.set(encryptedMessage, msgNonce.length);
        const ciphertext = util.encodeBase64(fullMessage);

        // 3. Encrypt the symmetric key for each recipient
        const recipientKeys = {};
        const mySecretKey = util.decodeBase64(mySecretKeyBase64);

        Object.keys(recipientPublicKeysMap).forEach(userId => {
            const theirPublicKeyBase64 = recipientPublicKeysMap[userId];
            if (!theirPublicKeyBase64) return;

            try {
                const theirPublicKey = util.decodeBase64(theirPublicKeyBase64);
                const nonce = nacl.randomBytes(nacl.box.nonceLength);
                // Encrypt the 'msgKey'
                const encryptedKey = nacl.box(msgKey, nonce, theirPublicKey, mySecretKey);

                const fullKey = new Uint8Array(nonce.length + encryptedKey.length);
                fullKey.set(nonce);
                fullKey.set(encryptedKey, nonce.length);

                recipientKeys[userId] = util.encodeBase64(fullKey);
            } catch (err) {
                console.error(`Failed to encrypt key for user ${userId}`, err);
            }
        });

        return { ciphertext, recipientKeys };

    } catch (e) {
        console.error("Group Encryption failed:", e);
        return null;
    }
};

export const decryptGroupMessage = (ciphertextBase64, senderPublicKeyBase64, mySecretKeyBase64, myEncryptedKeyBase64) => {
    try {
        if (!myEncryptedKeyBase64) throw new Error("No key for me");

        // 1. Decrypt the symmetric key
        const keyWithNonce = util.decodeBase64(myEncryptedKeyBase64);
        const keyNonce = keyWithNonce.slice(0, nacl.box.nonceLength);
        const encryptedKey = keyWithNonce.slice(nacl.box.nonceLength); // Rest is key

        const senderPublicKey = util.decodeBase64(senderPublicKeyBase64);
        const mySecretKey = util.decodeBase64(mySecretKeyBase64);

        const msgKey = nacl.box.open(encryptedKey, keyNonce, senderPublicKey, mySecretKey);
        if (!msgKey) throw new Error("Could not decrypt message key");

        // 2. Decrypt the message content
        const msgWithNonce = util.decodeBase64(ciphertextBase64);
        const msgNonce = msgWithNonce.slice(0, nacl.secretbox.nonceLength);
        const encryptedMsg = msgWithNonce.slice(nacl.secretbox.nonceLength);

        const decrypted = nacl.secretbox.open(encryptedMsg, msgNonce, msgKey);
        if (!decrypted) throw new Error("Could not decrypt message content");

        return util.encodeUTF8(decrypted);

    } catch (e) {
        console.error("Group Decryption failed:", e);
        return "[Encrypted Group Message]";
    }
};
