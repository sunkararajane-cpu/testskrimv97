// mockEncryption.ts
// Replaces real TweetNaCl implementation when MOCK_MODE = true

export const mockEncrypt = (message: string) => {
  return "ENCRYPTED::" + btoa(message);
};

export const mockDecrypt = (encrypted: string) => {
  if (encrypted.startsWith("ENCRYPTED::")) {
    return atob(encrypted.replace("ENCRYPTED::", ""));
  }
  return encrypted;
};

export const mockGenerateKeyPair = () => {
  return {
    publicKey: "mock_pub_key_" + Date.now(),
    privateKey: "mock_priv_key_" + Date.now()
  };
};
