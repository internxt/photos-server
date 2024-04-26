import CryptoJS from 'crypto-js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export enum AsymmetricEncryptionAlgorithms {
  EllipticCurve = 'ed25519',
}

export class CryptoService {
  private aesService: AesService;
  private cryptoSecret: string;

  constructor() {
    this.aesService = new AesService(
      process.env.MAGIC_IV as string,
      process.env.MAGIC_SALT as string,
      process.env.CRYPTO_SECRET2 as string
    );
    this.cryptoSecret = process.env.CRYPTO_SECRET as string;
  }

  encrypt(text: string, buffer?: Buffer) {
    return this.aesService.encrypt(text, buffer);
  }

  encryptName(name: string, salt?: number) {
    if (salt) {
      return this.aesService.encrypt(name, salt, salt === undefined);
    }
    return this.probabilisticEncryption(name);
  }

  deterministicEncryption(content: any, salt: any) {
    try {
      const key = CryptoJS.enc.Hex.parse(this.cryptoSecret);
      const iv = salt ? CryptoJS.enc.Hex.parse(salt.toString()) : key;

      const encrypt = CryptoJS.AES.encrypt(content, key, { iv }).toString();
      const b64 = CryptoJS.enc.Base64.parse(encrypt);
      const eHex = b64.toString(CryptoJS.enc.Hex);

      return eHex;
    } catch (e) {
      return null;
    }
  }

  probabilisticEncryption(content: any) {
    try {
      const b64 = CryptoJS.AES.encrypt(content, this.cryptoSecret).toString();
      const e64 = CryptoJS.enc.Base64.parse(b64);
      const eHex = e64.toString(CryptoJS.enc.Hex);

      return eHex;
    } catch (error) {
      console.error(`(probabilisticEncryption): ${error}`);

      return null;
    }
  }

  encryptText(textToEncrypt: string, salt?: number) {
    return this.encryptName(textToEncrypt, salt);
  }

  encryptTextWithKey(textToEncrypt: string, keyToEncrypt: string): string {
    const bytes = CryptoJS.AES.encrypt(textToEncrypt, keyToEncrypt).toString();
    const text64 = CryptoJS.enc.Base64.parse(bytes);

    return text64.toString(CryptoJS.enc.Hex);
  }

  passToHash(password: string): { salt: string; hash: string } {
    const salt = CryptoJS.lib.WordArray.random(128 / 8);
    const hash = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 10000,
    });
    const hashedObjetc = {
      salt: salt.toString(),
      hash: hash.toString(),
    };

    return hashedObjetc;
  }

  hashSha256(text: string | Buffer): string | null {
    try {
      return crypto.createHash('sha256').update(text).digest('hex');
    } catch (error) {
      console.error('[CRYPTO sha256] ', error);

      return null;
    }
  }

  hashBcrypt(text: string): string | null {
    try {
      return bcrypt.hashSync(text.toString(), 8);
    } catch (err) {
      console.error('FATAL BCRYPT ERROR', (err as Error).message);

      return null;
    }
  }
}

// AES Encryption/Decryption with AES-256-GCM using random Initialization Vector + Salt
// ----------------------------------------------------------------------------------------
// the encrypted datablock is base64 encoded for easy data exchange.
// if you have the option to store data binary save consider to remove the encoding to reduce storage size
// ----------------------------------------------------------------------------------------
// format of encrypted data - used by this example. not an official format
//
// +--------------------+-----------------------+----------------+----------------+
// | SALT               | Initialization Vector | Auth Tag       | Payload        |
// | Used to derive key | AES GCM XOR Init      | Data Integrity | Encrypted Data |
// | 64 Bytes, random   | 16 Bytes, random      | 16 Bytes       | (N-96) Bytes   |
// +--------------------+-----------------------+----------------+----------------+
//
// ----------------------------------------------------------------------------------------
// Input/Output Vars
//
// MASTERKEY: the key used for encryption/decryption.
//            it has to be cryptographic safe - this means randomBytes or derived by pbkdf2 (for example)
// TEXT:      data (utf8 string) which should be encoded. modify the code to use Buffer for binary data!
// ENCDATA:   encrypted data as base64 string (format mentioned on top)

export class AesService {
  constructor(
    private readonly magicIv: string,
    private readonly magicSalt: string,
    private readonly cryptoKey: string,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.magicIv) {
      throw new Error('AES SERVICE: Missing magic IV');
    }

    if (!this.magicSalt) {
      throw new Error('AES SERVICE: Missing magic salt');
    }

    if (!this.cryptoKey) {
      throw new Error('AES SERVICE: Missing crytpo key');
    }
  }

  encrypt(text: any, originalSalt: any, randomIv = false) {
    // random initialization vector
    const iv = randomIv
      ? crypto.randomBytes(16)
      : Buffer.from(this.magicIv, 'hex');

    // random salt
    const salt = randomIv
      ? crypto.randomBytes(64)
      : Buffer.from(this.magicSalt, 'hex');

    // derive encryption key: 32 byte key length
    // in assumption the masterkey is a cryptographic and NOT a password there is no need for
    // a large number of iterations. It may can replaced by HKDF
    // the value of 2145 is randomly chosen!
    const key = crypto.pbkdf2Sync(
      `${this.cryptoKey}-${originalSalt}`,
      salt,
      2145,
      32,
      'sha512',
    );

    // AES 256 GCM Mode
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    // encrypt the given text
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);

    // extract the auth tag
    const tag = cipher.getAuthTag();

    // generate output
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
  }
}