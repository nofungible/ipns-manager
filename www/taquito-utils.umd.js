(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('buffer'), require('@stablelib/ed25519'), require('@stablelib/blake2b'), require('blakejs'), require('bs58check'), require('bignumber.js'), require('elliptic'), require('typedarray-to-buffer')) :
  typeof define === 'function' && define.amd ? define(['exports', 'buffer', '@stablelib/ed25519', '@stablelib/blake2b', 'blakejs', 'bs58check', 'bignumber.js', 'elliptic', 'typedarray-to-buffer'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.taquitoUtils = {}, global.buffer, global.ed25519, global.blake2b, global.blake, global.bs58check, global.BigNumber, global.elliptic, global.toBuffer));
})(this, (function (exports, buffer, ed25519, blake2b, blake, bs58check, BigNumber, elliptic, toBuffer) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var blake__default = /*#__PURE__*/_interopDefaultLegacy(blake);
  var bs58check__default = /*#__PURE__*/_interopDefaultLegacy(bs58check);
  var BigNumber__default = /*#__PURE__*/_interopDefaultLegacy(BigNumber);
  var elliptic__default = /*#__PURE__*/_interopDefaultLegacy(elliptic);
  var toBuffer__default = /*#__PURE__*/_interopDefaultLegacy(toBuffer);

  exports.Prefix = void 0;
  (function (Prefix) {
      Prefix["TZ1"] = "tz1";
      Prefix["TZ2"] = "tz2";
      Prefix["TZ3"] = "tz3";
      Prefix["TZ4"] = "tz4";
      Prefix["KT"] = "KT";
      Prefix["KT1"] = "KT1";
      Prefix["EDSK2"] = "edsk2";
      Prefix["SPSK"] = "spsk";
      Prefix["P2SK"] = "p2sk";
      Prefix["EDPK"] = "edpk";
      Prefix["SPPK"] = "sppk";
      Prefix["P2PK"] = "p2pk";
      Prefix["BLPK"] = "BLpk";
      Prefix["EDESK"] = "edesk";
      Prefix["SPESK"] = "spesk";
      Prefix["P2ESK"] = "p2esk";
      Prefix["EDSK"] = "edsk";
      Prefix["EDSIG"] = "edsig";
      Prefix["SPSIG"] = "spsig";
      Prefix["P2SIG"] = "p2sig";
      Prefix["SIG"] = "sig";
      Prefix["NET"] = "Net";
      Prefix["NCE"] = "nce";
      Prefix["B"] = "B";
      Prefix["O"] = "o";
      Prefix["LO"] = "Lo";
      Prefix["LLO"] = "LLo";
      Prefix["P"] = "P";
      Prefix["CO"] = "Co";
      Prefix["ID"] = "id";
      Prefix["EXPR"] = "expr";
      Prefix["TZ"] = "TZ";
      Prefix["VH"] = "vh";
      Prefix["SASK"] = "sask";
      Prefix["ZET1"] = "zet1";
      //rollups
      Prefix["TXR1"] = "txr1";
      Prefix["TXI"] = "txi";
      Prefix["TXM"] = "txm";
      Prefix["TXC"] = "txc";
      Prefix["TXMR"] = "txmr";
      Prefix["TXRL"] = "txM";
      Prefix["TXW"] = "txw";
  })(exports.Prefix || (exports.Prefix = {}));
  const prefix = {
      [exports.Prefix.TZ1]: new Uint8Array([6, 161, 159]),
      [exports.Prefix.TZ2]: new Uint8Array([6, 161, 161]),
      [exports.Prefix.TZ3]: new Uint8Array([6, 161, 164]),
      [exports.Prefix.TZ4]: new Uint8Array([6, 161, 166]),
      [exports.Prefix.KT]: new Uint8Array([2, 90, 121]),
      [exports.Prefix.KT1]: new Uint8Array([2, 90, 121]),
      [exports.Prefix.EDSK]: new Uint8Array([43, 246, 78, 7]),
      [exports.Prefix.EDSK2]: new Uint8Array([13, 15, 58, 7]),
      [exports.Prefix.SPSK]: new Uint8Array([17, 162, 224, 201]),
      [exports.Prefix.P2SK]: new Uint8Array([16, 81, 238, 189]),
      [exports.Prefix.EDPK]: new Uint8Array([13, 15, 37, 217]),
      [exports.Prefix.SPPK]: new Uint8Array([3, 254, 226, 86]),
      [exports.Prefix.P2PK]: new Uint8Array([3, 178, 139, 127]),
      [exports.Prefix.BLPK]: new Uint8Array([6, 149, 135, 204]),
      [exports.Prefix.EDESK]: new Uint8Array([7, 90, 60, 179, 41]),
      [exports.Prefix.SPESK]: new Uint8Array([0x09, 0xed, 0xf1, 0xae, 0x96]),
      [exports.Prefix.P2ESK]: new Uint8Array([0x09, 0x30, 0x39, 0x73, 0xab]),
      [exports.Prefix.EDSIG]: new Uint8Array([9, 245, 205, 134, 18]),
      [exports.Prefix.SPSIG]: new Uint8Array([13, 115, 101, 19, 63]),
      [exports.Prefix.P2SIG]: new Uint8Array([54, 240, 44, 52]),
      [exports.Prefix.SIG]: new Uint8Array([4, 130, 43]),
      [exports.Prefix.NET]: new Uint8Array([87, 82, 0]),
      [exports.Prefix.NCE]: new Uint8Array([69, 220, 169]),
      [exports.Prefix.B]: new Uint8Array([1, 52]),
      [exports.Prefix.O]: new Uint8Array([5, 116]),
      [exports.Prefix.LO]: new Uint8Array([133, 233]),
      [exports.Prefix.LLO]: new Uint8Array([29, 159, 109]),
      [exports.Prefix.P]: new Uint8Array([2, 170]),
      [exports.Prefix.CO]: new Uint8Array([79, 179]),
      [exports.Prefix.ID]: new Uint8Array([153, 103]),
      [exports.Prefix.EXPR]: new Uint8Array([13, 44, 64, 27]),
      // Legacy prefix
      [exports.Prefix.TZ]: new Uint8Array([2, 90, 121]),
      [exports.Prefix.VH]: new Uint8Array([1, 106, 242]),
      [exports.Prefix.SASK]: new Uint8Array([11, 237, 20, 92]),
      [exports.Prefix.ZET1]: new Uint8Array([18, 71, 40, 223]),
      [exports.Prefix.TXR1]: new Uint8Array([1, 128, 120, 31]),
      [exports.Prefix.TXI]: new Uint8Array([79, 148, 196]),
      [exports.Prefix.TXM]: new Uint8Array([79, 149, 30]),
      [exports.Prefix.TXC]: new Uint8Array([79, 148, 17]),
      [exports.Prefix.TXMR]: new Uint8Array([18, 7, 206, 87]),
      [exports.Prefix.TXRL]: new Uint8Array([79, 146, 82]),
      [exports.Prefix.TXW]: new Uint8Array([79, 150, 72]),
  };
  const prefixLength = {
      [exports.Prefix.TZ1]: 20,
      [exports.Prefix.TZ2]: 20,
      [exports.Prefix.TZ3]: 20,
      [exports.Prefix.TZ4]: 20,
      [exports.Prefix.KT]: 20,
      [exports.Prefix.KT1]: 20,
      [exports.Prefix.EDPK]: 32,
      [exports.Prefix.SPPK]: 33,
      [exports.Prefix.P2PK]: 33,
      //working with value in comment for base58.ml line 445 but not consistent with the three above
      [exports.Prefix.BLPK]: 48,
      [exports.Prefix.EDSIG]: 64,
      [exports.Prefix.SPSIG]: 64,
      [exports.Prefix.P2SIG]: 64,
      [exports.Prefix.SIG]: 64,
      [exports.Prefix.NET]: 4,
      [exports.Prefix.B]: 32,
      [exports.Prefix.P]: 32,
      [exports.Prefix.O]: 32,
      [exports.Prefix.VH]: 32,
      [exports.Prefix.SASK]: 169,
      [exports.Prefix.ZET1]: 43,
      [exports.Prefix.TXR1]: 20,
      [exports.Prefix.TXI]: 32,
      [exports.Prefix.TXM]: 32,
      [exports.Prefix.TXC]: 32,
      [exports.Prefix.TXMR]: 32,
      [exports.Prefix.TXRL]: 32,
      [exports.Prefix.TXW]: 32,
  };

  /**
   *  @category Error
   *  @description Error that indicates an invalid key being passed or used
   */
  class InvalidKeyError extends Error {
      constructor(key, errorDetail) {
          super();
          this.key = key;
          this.errorDetail = errorDetail;
          this.name = 'InvalidKeyError';
          const baseMessage = `The key ${key} is invalid.`;
          this.message = errorDetail ? `${baseMessage} ${errorDetail}` : baseMessage;
      }
  }
  /**
   *  @category Error
   *  @description Error that indicates an Invalid Public Key being passed or used
   */
  class InvalidPublicKeyError extends Error {
      constructor(publicKey, errorDetail) {
          super();
          this.publicKey = publicKey;
          this.name = 'InvalidPublicKeyError';
          const baseMessage = `The public key '${publicKey}' is invalid.`;
          this.message = errorDetail ? `${baseMessage} ${errorDetail}` : baseMessage;
      }
  }
  /**
   *  @category Error
   *  @description Error that indicates an invalid signature being passed or used
   */
  class InvalidSignatureError extends Error {
      constructor(signature, errorDetail) {
          super();
          this.signature = signature;
          this.name = 'InvalidSignatureError';
          const baseMessage = `The signature '${signature}' is invalid.`;
          this.message = errorDetail ? `${baseMessage} ${errorDetail}` : baseMessage;
      }
  }
  /**
   *  @category Error
   *  @description Error that indicates an invalid message being passed or used
   */
  class InvalidMessageError extends Error {
      constructor(msg, errorDetail) {
          super();
          this.msg = msg;
          this.errorDetail = errorDetail;
          this.name = 'InvalidMessageError';
          const baseMessage = `The message '${msg}' is invalid.`;
          this.message = errorDetail ? `${baseMessage} ${errorDetail}` : baseMessage;
      }
  }
  /**
   *  @category Error
   *  @description Error that indicates an invalid contract address being passed or used
   */
  class InvalidContractAddressError extends Error {
      constructor(contractAddress) {
          super(`The contract address '${contractAddress}' is invalid`);
          this.contractAddress = contractAddress;
          this.name = 'InvalidContractAddressError';
      }
  }
  /**
   *  @category Error
   *  @description Error that indicates an invalid address being passed or used (both contract and implicit)
   */
  class InvalidAddressError extends Error {
      constructor(address, errorDetail) {
          super();
          this.address = address;
          this.name = 'InvalidAddressError';
          const baseMessage = `The address '${address}' is invalid.`;
          this.message = errorDetail ? `${baseMessage} ${errorDetail}` : baseMessage;
      }
  }
  /**
   *  @category Error
   *  @description Error that indicates an invalid chain id being passed or used
   */
  class InvalidChainIdError extends Error {
      constructor(chainId) {
          super(`The chain id '${chainId}' is invalid`);
          this.chainId = chainId;
          this.name = 'InvalidChainIdError';
      }
  }
  /**
   *  @category Error
   *  @description Error that indicates an invalid key hash being passed or used
   */
  class InvalidKeyHashError extends Error {
      constructor(keyHash) {
          super(`The public key hash '${keyHash}' is invalid`);
          this.keyHash = keyHash;
          this.name = 'InvalidKeyHashError';
      }
  }
  /**
   *  @category Error
   *  @description Error that indicates an invalid block hash being passed or used
   */ class InvalidBlockHashError extends Error {
      constructor(blockHash) {
          super(`The block hash '${blockHash}' is invalid`);
          this.blockHash = blockHash;
          this.name = 'InvalidBlockHashError';
      }
  }
  /**
   *  @category Error
   *  @description Error that indicates invalid protocol hash being passed or used
   */
  class InvalidProtocolHashError extends Error {
      constructor(protocolHash) {
          super(`The protocol hash '${protocolHash}' is invalid`);
          this.protocolHash = protocolHash;
          this.name = 'InvalidProtocolHashError';
      }
  }
  /**
   *  @category Error
   *  @description Error that indicates an invalid operation hash being passed or used
   */ class InvalidOperationHashError extends Error {
      constructor(operationHash) {
          super(`The operation hash '${operationHash}' is invalid`);
          this.operationHash = operationHash;
          this.name = 'InvalidOperationHashError';
      }
  }
  /**
   *  @category Error
   *  @description Error that indicates an invalid operation kind being passed or used
   */
  class InvalidOperationKindError extends Error {
      constructor(operationKind) {
          super(`The operation kind '${operationKind}' is unsupported`);
          this.operationKind = operationKind;
          this.name = 'InvalidOperationKindError';
      }
  }
  /**
   *  @category Error
   *  @description General error that indicates something is no longer supported and/or deprecated
   */
  class DeprecationError extends Error {
      constructor(message) {
          super(message);
          this.message = message;
          this.name = 'DeprecationError';
      }
  }
  /**
   *  @category Error
   *  @description General error that indicates an action is prohibited or not allowed
   */
  class ProhibitedActionError extends Error {
      constructor(message) {
          super(message);
          this.message = message;
          this.name = 'ProhibitedActionError';
      }
  }
  /**
   *  @category Error
   *  @description General error that indicates a failure when trying to convert data from one type to another
   */
  class ValueConversionError extends Error {
      constructor(value, desiredType) {
          super(`Unable to convert ${value} to a ${desiredType}`);
          this.value = value;
          this.desiredType = desiredType;
          this.name = 'ValueConversionError';
      }
  }
  /**
   *  @category Error
   *  @description Error that indicates an invalid hex string being passed or used
   */
  class InvalidHexStringError extends Error {
      constructor(message) {
          super(message);
          this.message = message;
          this.name = 'InvalidHexStringError';
      }
  }

  /**
   * @description Verify signature of a payload
   *
   * @param messageBytes The forged message including the magic byte (11 for block,
   *        12 for preendorsement, 13 for endorsement, 3 for generic, 5 for the PACK format of michelson)
   * @param publicKey The public key to verify the signature against
   * @param signature The signature to verify
   * @returns A boolean indicating if the signature matches
   *
   * @example
   * ```
   * const message = '03d0c10e3ed11d7c6e3357f6ef335bab9e8f2bd54d0ce20c482e241191a6e4b8ce6c01be917311d9ac46959750e405d57e268e2ed9e174a80794fbd504e12a4a000141eb3781afed2f69679ff2bbe1c5375950b0e40d00ff000000005e05050505050507070100000024747a32526773486e74516b72794670707352466261313652546656503539684b72654a4d07070100000024747a315a6672455263414c42776d4171776f6e525859565142445439426a4e6a42484a750001';
   * const pk = 'sppk7c7hkPj47yjYFEHX85q46sFJGw6RBrqoVSHwAJAT4e14KJwzoey';
   * const sig = 'spsig1cdLkp1RLgUHAp13aRFkZ6MQDPp7xCnjAExGL3MBSdMDmT6JgQSX8cufyDgJRM3sinFtiCzLbsyP6d365EHoNevxhT47nx'
   *
   * const response = verifySignature(message, pk, sig);
   * ```
   *
   */
  function verifySignature(messageBytes, publicKey, signature) {
      const pkPrefix = validatePkAndExtractPrefix(publicKey);
      const sigPrefix = validateSigAndExtractPrefix(signature);
      const decodedPublicKey = b58cdecode(publicKey, prefix[pkPrefix]);
      const decodedSig = b58cdecode(signature, prefix[sigPrefix]);
      const bytesHash = blake2b.hash(hex2buf(validateMessageNotEmpty(messageBytes)), 32);
      if (pkPrefix === exports.Prefix.EDPK) {
          return verifyEdSignature(decodedSig, bytesHash, decodedPublicKey);
      }
      else if (pkPrefix === exports.Prefix.SPPK) {
          return verifySpSignature(decodedSig, bytesHash, decodedPublicKey);
      }
      else if (pkPrefix === exports.Prefix.P2PK) {
          return verifyP2Signature(decodedSig, bytesHash, decodedPublicKey);
      }
      else {
          return false;
      }
  }
  function validateMessageNotEmpty(message) {
      if (message === '') {
          throw new InvalidMessageError(message, 'The message provided for verifying signature cannot be empty.');
      }
      return message;
  }
  function validatePkAndExtractPrefix(publicKey) {
      if (publicKey === '') {
          throw new InvalidPublicKeyError(publicKey, 'Public key cannot be empty');
      }
      const pkPrefix = publicKey.substring(0, 4);
      const validation = validatePublicKey(publicKey);
      if (validation !== exports.ValidationResult.VALID) {
          if (validation === exports.ValidationResult.INVALID_CHECKSUM) {
              throw new InvalidPublicKeyError(publicKey, 'The public key provided has an invalid checksum');
          }
          else if (validation === exports.ValidationResult.INVALID_LENGTH) {
              throw new InvalidPublicKeyError(publicKey, 'The public key provided has an invalid length');
          }
          else if (validation === exports.ValidationResult.NO_PREFIX_MATCHED) {
              throw new InvalidPublicKeyError(publicKey, `The public key provided has an unsupported prefix: ${pkPrefix}`);
          }
      }
      return pkPrefix;
  }
  function validateSigAndExtractPrefix(signature) {
      const signaturePrefix = signature.startsWith('sig')
          ? signature.substr(0, 3)
          : signature.substr(0, 5);
      const validation = validateSignature(signature);
      if (validation !== exports.ValidationResult.VALID) {
          if (validation === exports.ValidationResult.INVALID_CHECKSUM) {
              throw new InvalidSignatureError(signature, `invalid checksum`);
          }
          else if (validation === exports.ValidationResult.INVALID_LENGTH) {
              throw new InvalidSignatureError(signature, 'invalid length');
          }
          else if (validation === exports.ValidationResult.NO_PREFIX_MATCHED) {
              throw new InvalidSignatureError(signaturePrefix, 'unsupported prefix');
          }
      }
      return signaturePrefix;
  }
  function verifyEdSignature(decodedSig, bytesHash, decodedPublicKey) {
      try {
          return ed25519.verify(decodedPublicKey, bytesHash, decodedSig);
      }
      catch (e) {
          return false;
      }
  }
  function verifySpSignature(decodedSig, bytesHash, decodedPublicKey) {
      const key = new elliptic__default["default"].ec('secp256k1').keyFromPublic(decodedPublicKey);
      return verifySpOrP2Sig(decodedSig, bytesHash, key);
  }
  function verifyP2Signature(decodedSig, bytesHash, decodedPublicKey) {
      const key = new elliptic__default["default"].ec('p256').keyFromPublic(decodedPublicKey);
      return verifySpOrP2Sig(decodedSig, bytesHash, key);
  }
  function verifySpOrP2Sig(decodedSig, bytesHash, key) {
      const hexSig = buf2hex(toBuffer__default["default"](decodedSig));
      const match = hexSig.match(/([a-f\d]{64})/gi);
      if (match) {
          try {
              const [r, s] = match;
              return key.verify(bytesHash, { r, s });
          }
          catch (e) {
              return false;
          }
      }
      return false;
  }

  exports.ValidationResult = void 0;
  (function (ValidationResult) {
      ValidationResult[ValidationResult["NO_PREFIX_MATCHED"] = 0] = "NO_PREFIX_MATCHED";
      ValidationResult[ValidationResult["INVALID_CHECKSUM"] = 1] = "INVALID_CHECKSUM";
      ValidationResult[ValidationResult["INVALID_LENGTH"] = 2] = "INVALID_LENGTH";
      ValidationResult[ValidationResult["VALID"] = 3] = "VALID";
  })(exports.ValidationResult || (exports.ValidationResult = {}));
  function isValidPrefix(value) {
      if (typeof value !== 'string') {
          return false;
      }
      return value in prefix;
  }
  /**
   * @description This function is called by the validation functions ([[validateAddress]], [[validateChain]], [[validateContractAddress]], [[validateKeyHash]], [[validateSignature]], [[validatePublicKey]]).
   * Verify if the value has the right prefix or return `NO_PREFIX_MATCHED`,
   * decode the value using base58 and return `INVALID_CHECKSUM` if it fails,
   * check if the length of the value matches the prefix type or return `INVALID_LENGTH`.
   * If all checks pass, return `VALID`.
   *
   * @param value Value to validate
   * @param prefixes prefix the value should have
   */
  function validatePrefixedValue(value, prefixes) {
      const match = new RegExp(`^(${prefixes.join('|')})`).exec(value);
      if (!match || match.length === 0) {
          return exports.ValidationResult.NO_PREFIX_MATCHED;
      }
      const prefixKey = match[0];
      if (!isValidPrefix(prefixKey)) {
          return exports.ValidationResult.NO_PREFIX_MATCHED;
      }
      // Remove annotation from contract address before doing the validation
      const contractAddress = /^(KT1\w{33})(%(.*))?/.exec(value);
      if (contractAddress) {
          value = contractAddress[1];
      }
      // decodeUnsafe return undefined if decoding fail
      let decoded = bs58check__default["default"].decodeUnsafe(value);
      if (!decoded) {
          return exports.ValidationResult.INVALID_CHECKSUM;
      }
      decoded = decoded.slice(prefix[prefixKey].length);
      if (decoded.length !== prefixLength[prefixKey]) {
          return exports.ValidationResult.INVALID_LENGTH;
      }
      return exports.ValidationResult.VALID;
  }
  const implicitPrefix = [exports.Prefix.TZ1, exports.Prefix.TZ2, exports.Prefix.TZ3, exports.Prefix.TZ4];
  const contractPrefix = [exports.Prefix.KT1, exports.Prefix.TXR1];
  const signaturePrefix = [exports.Prefix.EDSIG, exports.Prefix.P2SIG, exports.Prefix.SPSIG, exports.Prefix.SIG];
  const pkPrefix = [exports.Prefix.EDPK, exports.Prefix.SPPK, exports.Prefix.P2PK, exports.Prefix.BLPK];
  const operationPrefix = [exports.Prefix.O];
  const protocolPrefix = [exports.Prefix.P];
  const blockPrefix = [exports.Prefix.B];
  /**
   * @description Used to check if an address or a contract address is valid.
   *
   * @returns
   * 0 (NO_PREFIX_MATCHED), 1 (INVALID_CHECKSUM), 2 (INVALID_LENGTH) or 3 (VALID).
   *
   * @example
   * ```
   * import { validateAddress } from '@taquito/utils';
   * const pkh = 'tz1L9r8mWmRPndRhuvMCWESLGSVeFzQ9NAWx'
   * const validation = validateAddress(pkh)
   * console.log(validation)
   * // This example return 3 which correspond to VALID
   * ```
   */
  function validateAddress(value) {
      return validatePrefixedValue(value, [...implicitPrefix, ...contractPrefix]);
  }
  /**
   * @description Used to check if a chain id is valid.
   *
   * @returns
   * 0 (NO_PREFIX_MATCHED), 1 (INVALID_CHECKSUM), 2 (INVALID_LENGTH) or 3 (VALID).
   *
   * @example
   * ```
   * import { validateChain } from '@taquito/utils';
   * const chainId = 'NetXdQprcVkpaWU'
   * const validation = validateChain(chainId)
   * console.log(validation)
   * // This example return 3 which correspond to VALID
   * ```
   */
  function validateChain(value) {
      return validatePrefixedValue(value, [exports.Prefix.NET]);
  }
  /**
   * @description Used to check if a contract address is valid.
   *
   * @returns
   * 0 (NO_PREFIX_MATCHED), 1 (INVALID_CHECKSUM), 2 (INVALID_LENGTH) or 3 (VALID).
   *
   * @example
   * ```
   * import { validateContractAddress } from '@taquito/utils';
   * const contractAddress = 'KT1JVErLYTgtY8uGGZ4mso2npTSxqVLDRVbC'
   * const validation = validateContractAddress(contractAddress)
   * console.log(validation)
   * // This example return 3 which correspond to VALID
   * ```
   */
  function validateContractAddress(value) {
      return validatePrefixedValue(value, contractPrefix);
  }
  /**
   * @description Used to check if a key hash is valid.
   *
   * @returns
   * 0 (NO_PREFIX_MATCHED), 1 (INVALID_CHECKSUM), 2 (INVALID_LENGTH) or 3 (VALID).
   *
   * @example
   * ```
   * import { validateKeyHash } from '@taquito/utils';
   * const keyHashWithoutPrefix = '1L9r8mWmRPndRhuvMCWESLGSVeFzQ9NAWx'
   * const validation = validateKeyHash(keyHashWithoutPrefix)
   * console.log(validation)
   * // This example return 0 which correspond to NO_PREFIX_MATCHED
   * ```
   */
  function validateKeyHash(value) {
      return validatePrefixedValue(value, implicitPrefix);
  }
  /**
   * @description Used to check if a signature is valid.
   *
   * @returns
   * 0 (NO_PREFIX_MATCHED), 1 (INVALID_CHECKSUM), 2 (INVALID_LENGTH) or 3 (VALID).
   *
   * @example
   * ```
   * import { validateSignature } from '@taquito/utils';
   * const signature = 'edsigtkpiSSschcaCt9pUVrpNPf7TTcgvgDEDD6NCEHMy8NNQJCGnMfLZzYoQj74yLjo9wx6MPVV29CvVzgi7qEcEUok3k7AuMg'
   * const validation = validateSignature(signature)
   * console.log(validation)
   * // This example return 3 which correspond to VALID
   * ```
   */
  function validateSignature(value) {
      return validatePrefixedValue(value, signaturePrefix);
  }
  /**
   * @description Used to check if a public key is valid.
   *
   * @returns
   * 0 (NO_PREFIX_MATCHED), 1 (INVALID_CHECKSUM), 2 (INVALID_LENGTH) or 3 (VALID).
   *
   * @example
   * ```
   * import { validatePublicKey } from '@taquito/utils';
   * const publicKey = 'edpkvS5QFv7KRGfa3b87gg9DBpxSm3NpSwnjhUjNBQrRUUR66F7C9g'
   * const validation = validatePublicKey(publicKey)
   * console.log(validation)
   * // This example return 3 which correspond to VALID
   * ```
   */
  function validatePublicKey(value) {
      return validatePrefixedValue(value, pkPrefix);
  }
  /**
   * @description Used to check if an operation hash is valid.
   *
   * @returns
   * 0 (NO_PREFIX_MATCHED), 1 (INVALID_CHECKSUM), 2 (INVALID_LENGTH) or 3 (VALID).
   *
   * @example
   * ```
   * import { validateOperation } from '@taquito/utils';
   * const operationHash = 'oo6JPEAy8VuMRGaFuMmLNFFGdJgiaKfnmT1CpHJfKP3Ye5ZahiP'
   * const validation = validateOperation(operationHash)
   * console.log(validation)
   * // This example return 3 which correspond to VALID
   * ```
   */
  function validateOperation(value) {
      return validatePrefixedValue(value, operationPrefix);
  }
  /**
   * @description Used to check if a protocol hash is valid.
   *
   * @returns
   * 0 (NO_PREFIX_MATCHED), 1 (INVALID_CHECKSUM), 2 (INVALID_LENGTH) or 3 (VALID).
   *
   * @example
   * ```
   * import { validateProtocol } from '@taquito/utils';
   * const protocolHash = 'PtHangz2aRngywmSRGGvrcTyMbbdpWdpFKuS4uMWxg2RaH9i1qx'
   * const validation = validateProtocol(protocolHash)
   * console.log(validation)
   * // This example return 3 which correspond to VALID
   * ```
   */
  function validateProtocol(value) {
      return validatePrefixedValue(value, protocolPrefix);
  }
  /**
   * @description Used to check if a block hash is valid.
   *
   * @returns
   * 0 (NO_PREFIX_MATCHED), 1 (INVALID_CHECKSUM), 2 (INVALID_LENGTH) or 3 (VALID).
   *
   * @example
   * ```
   * import { validateBlock } from '@taquito/utils';
   * const blockHash = 'PtHangz2aRngywmSRGGvrcTyMbbdpWdpFKuS4uMWxg2RaH9i1qx'
   * const validation = validateBlock(blockHash)
   * console.log(validation)
   * // This example return 3 which correspond to VALID
   * ```
   */
  function validateBlock(value) {
      return validatePrefixedValue(value, blockPrefix);
  }
  /**
   * @description Used to check if a spending key is valid.
   * @returns 0 (NO_PREFIX_MATCHED), 1 (INVALID_CHECKSUM), 2 (INVALID_LENGTH) or 3 (VALID).
   *
   */
  function validateSpendingKey(value) {
      return validatePrefixedValue(value, [exports.Prefix.SASK]);
  }

  // IMPORTANT: THIS FILE IS AUTO GENERATED! DO NOT MANUALLY EDIT OR CHECKIN!
  const VERSION = {
      commitHash: 'd474f2ac7abec2e8faddba47cf403a0c0203c7d5',
      version: '14.2.0-beta-RC.0',
  };

  const TZ_DECIMALS = 6;
  const MTZ_DECIMALS = 3;
  function getDecimal(format) {
      switch (format) {
          case 'tz':
              return TZ_DECIMALS;
          case 'mtz':
              return MTZ_DECIMALS;
          case 'mutez':
          default:
              return 0;
      }
  }
  function format(from = 'mutez', to = 'mutez', amount) {
      const bigNum = new BigNumber__default["default"](amount);
      if (bigNum.isNaN()) {
          return amount;
      }
      return bigNum
          .multipliedBy(Math.pow(10, getDecimal(from)))
          .dividedBy(Math.pow(10, getDecimal(to)));
  }

  /**
   * @packageDocumentation
   * @module @taquito/utils
   */
  /**
   *
   * @description Hash a string using the BLAKE2b algorithm, base58 encode the hash obtained and appends the prefix 'expr' to it
   *
   * @param value Value in hex
   */
  function encodeExpr(value) {
      const blakeHash = blake__default["default"].blake2b(hex2buf(value), undefined, 32);
      return b58cencode(blakeHash, prefix['expr']);
  }
  /**
   *
   * @description Return the operation hash of a signed operation
   * @param value Value in hex of a signed operation
   */
  function encodeOpHash(value) {
      const blakeHash = blake__default["default"].blake2b(hex2buf(value), undefined, 32);
      return b58cencode(blakeHash, prefix.o);
  }
  /**
   *
   * @description Base58 encode a string or a Uint8Array and append a prefix to it
   *
   * @param value Value to base58 encode
   * @param prefix prefix to append to the encoded string
   */
  function b58cencode(value, prefix) {
      const payloadAr = typeof value === 'string' ? Uint8Array.from(buffer.Buffer.from(value, 'hex')) : value;
      const n = new Uint8Array(prefix.length + payloadAr.length);
      n.set(prefix);
      n.set(payloadAr, prefix.length);
      return bs58check__default["default"].encode(buffer.Buffer.from(n.buffer));
  }
  /**
   *
   * @description Base58 decode a string and remove the prefix from it
   *
   * @param value Value to base58 decode
   * @param prefix prefix to remove from the decoded string
   */
  const b58cdecode = (enc, prefixArg) => bs58check__default["default"].decode(enc).slice(prefixArg.length);
  /**
   *
   * @description Base58 decode a string with predefined prefix
   *
   * @param value Value to base58 decode
   */
  function b58decode(payload) {
      const buf = bs58check__default["default"].decode(payload);
      const prefixMap = {
          [prefix.tz1.toString()]: '0000',
          [prefix.tz2.toString()]: '0001',
          [prefix.tz3.toString()]: '0002',
      };
      const rollupPrefMap = {
          [prefix.txr1.toString()]: '02',
      };
      const pref = prefixMap[new Uint8Array(buf.slice(0, 3)).toString()];
      const rollupPref = rollupPrefMap[new Uint8Array(buf.slice(0, 4)).toString()];
      if (pref) {
          // tz addresses
          const hex = buf2hex(buf.slice(3));
          return pref + hex;
      }
      else if (rollupPref) {
          const hex = buf2hex(buf.slice(4));
          return rollupPref + hex + '00';
      }
      else {
          // other (kt addresses)
          return '01' + buf2hex(buf.slice(3, 42)) + '00';
      }
  }
  /**
   *
   * @description b58 decode a string without predefined prefix
   * @param value
   * @returns string of bytes
   */
  function b58decodeL2Address(payload) {
      const buf = bs58check__default["default"].decode(payload);
      // tz4 address currently
      return buf2hex(buf.slice(3, 42));
  }
  /**
   *
   * @description Base58 encode an address using predefined prefix
   *
   * @param value Address to base58 encode (tz1, tz2, tz3 or KT1)
   */
  function encodePubKey(value) {
      if (value.substring(0, 2) === '00') {
          const pref = {
              '0000': prefix.tz1,
              '0001': prefix.tz2,
              '0002': prefix.tz3,
          };
          return b58cencode(value.substring(4), pref[value.substring(0, 4)]);
      }
      else if (value.substring(0, 2) === '02') {
          // 42 also works but the removes the 00 padding at the end
          return b58cencode(value.substring(2, value.length - 2), prefix.txr1);
      }
      return b58cencode(value.substring(2, 42), prefix.KT);
  }
  /**
   *
   * @description Base58 encode an address without predefined prefix
   * @param value Address to base58 encode (tz4) hex dec
   * @returns return address
   */
  function encodeL2Address(value) {
      return b58cencode(value, prefix.tz4);
  }
  /**
   *
   * @description Base58 encode a key according to its prefix
   *
   * @param value Key to base58 encode
   */
  function encodeKey(value) {
      if (value[0] === '0') {
          const pref = {
              '00': new Uint8Array([13, 15, 37, 217]),
              '01': new Uint8Array([3, 254, 226, 86]),
              '02': new Uint8Array([3, 178, 139, 127]),
          };
          return b58cencode(value.substring(2), pref[value.substring(0, 2)]);
      }
  }
  /**
   *
   * @description Base58 encode a key hash according to its prefix
   *
   * @param value Key hash to base58 encode
   */
  function encodeKeyHash(value) {
      if (value[0] === '0') {
          const pref = {
              '00': new Uint8Array([6, 161, 159]),
              '01': new Uint8Array([6, 161, 161]),
              '02': new Uint8Array([6, 161, 164]),
          };
          return b58cencode(value.substring(2), pref[value.substring(0, 2)]);
      }
  }
  /**
   *
   * @description Convert an hex string to a Uint8Array
   *
   * @param hex Hex string to convert
   */
  const hex2buf = (hex) => {
      const match = hex.match(/[\da-f]{2}/gi);
      if (match) {
          return new Uint8Array(match.map((h) => parseInt(h, 16)));
      }
      else {
          throw new ValueConversionError(hex, 'Uint8Array');
      }
  };
  /**
   *
   * @description Merge 2 buffers together
   *
   * @param b1 First buffer
   * @param b2 Second buffer
   */
  const mergebuf = (b1, b2) => {
      const r = new Uint8Array(b1.length + b2.length);
      r.set(b1);
      r.set(b2, b1.length);
      return r;
  };
  /**
   *
   * @description Flatten a michelson json representation to an array
   *
   * @param s michelson json
   */
  const mic2arr = function me2(s) {
      let ret = [];
      if (Object.prototype.hasOwnProperty.call(s, 'prim')) {
          if (s.prim === 'Pair') {
              ret.push(me2(s.args[0]));
              ret = ret.concat(me2(s.args[1]));
          }
          else if (s.prim === 'Elt') {
              ret = {
                  key: me2(s.args[0]),
                  val: me2(s.args[1]),
              };
          }
          else if (s.prim === 'True') {
              ret = true;
          }
          else if (s.prim === 'False') {
              ret = false;
          }
      }
      else if (Array.isArray(s)) {
          const sc = s.length;
          for (let i = 0; i < sc; i++) {
              const n = me2(s[i]);
              if (typeof n.key !== 'undefined') {
                  if (Array.isArray(ret)) {
                      ret = {
                          keys: [],
                          vals: [],
                      };
                  }
                  ret.keys.push(n.key);
                  ret.vals.push(n.val);
              }
              else {
                  ret.push(n);
              }
          }
      }
      else if (Object.prototype.hasOwnProperty.call(s, 'string')) {
          ret = s.string;
      }
      else if (Object.prototype.hasOwnProperty.call(s, 'int')) {
          ret = parseInt(s.int, 10);
      }
      else {
          ret = s;
      }
      return ret;
  };
  /**
   *
   * @description Convert a buffer to an hex string
   *
   * @param buffer Buffer to convert
   */
  const buf2hex = (buffer) => {
      const byteArray = new Uint8Array(buffer);
      const hexParts = [];
      byteArray.forEach((byte) => {
          const hex = byte.toString(16);
          const paddedHex = `00${hex}`.slice(-2);
          hexParts.push(paddedHex);
      });
      return hexParts.join('');
  };
  /**
   *
   *  @description Gets Tezos address (PKH) from Public Key
   *
   *  @param publicKey Public Key
   *  @returns A string of the Tezos address (PKH) that was derived from the given Public Key
   */
  const getPkhfromPk = (publicKey) => {
      let encodingPrefix;
      let prefixLen;
      const keyPrefix = validatePkAndExtractPrefix(publicKey);
      const decoded = b58cdecode(publicKey, prefix[keyPrefix]);
      switch (keyPrefix) {
          case exports.Prefix.EDPK:
              encodingPrefix = prefix[exports.Prefix.TZ1];
              prefixLen = prefixLength[exports.Prefix.TZ1];
              break;
          case exports.Prefix.SPPK:
              encodingPrefix = prefix[exports.Prefix.TZ2];
              prefixLen = prefixLength[exports.Prefix.TZ2];
              break;
          case exports.Prefix.P2PK:
              encodingPrefix = prefix[exports.Prefix.TZ3];
              prefixLen = prefixLength[exports.Prefix.TZ3];
              break;
          case exports.Prefix.BLPK:
              encodingPrefix = prefix[exports.Prefix.TZ4];
              prefixLen = prefixLength[exports.Prefix.TZ4];
      }
      const hashed = blake2b.hash(decoded, prefixLen);
      const result = b58cencode(hashed, encodingPrefix);
      return result;
  };
  /**
   *
   * @description Convert a string to bytes
   *
   * @param str String to convert
   */
  function char2Bytes(str) {
      return buffer.Buffer.from(str, 'utf8').toString('hex');
  }
  /**
   *
   * @description Convert bytes to a string
   *
   * @param str Bytes to convert
   */
  function bytes2Char(hex) {
      return buffer.Buffer.from(hex2buf(hex)).toString('utf8');
  }
  /**
   *
   * @description Convert hex string/UintArray/Buffer to bytes
   *
   * @param hex String value to convert to bytes
   */
  function hex2Bytes(hex) {
      if (!hex.match(/[\da-f]{2}/gi)) {
          throw new InvalidHexStringError(`The hex string ${hex} does not have an even number of characters`);
      }
      return buffer.Buffer.from(hex, 'hex');
  }
  /**
   *
   * @description Converts a number or Bignumber to hexadecimal  string
   *
   * @param val The value  that will be converted to a hexadecimal string value
   */
  function toHexBuf(val, bitLength = 8) {
      return buffer.Buffer.from(num2PaddedHex(val, bitLength), 'hex');
  }
  /**
   *
   * @description Converts a number or BigNumber to a padded hexadecimal string
   * @param val The value that will be converted into a padded hexadecimal string value
   * @param bitLength The length of bits
   *
   */
  function num2PaddedHex(val, bitLength = 8) {
      if (new BigNumber__default["default"](val).isPositive()) {
          const nibbleLength = Math.ceil(bitLength / 4);
          const hex = val.toString(16);
          // check whether nibble (4 bits) length is higher or lowerthan the current hex string length
          let targetLength = hex.length >= nibbleLength ? hex.length : nibbleLength;
          // make sure the hex string target length is even
          targetLength = targetLength % 2 == 0 ? targetLength : targetLength + 1;
          return padHexWithZero(hex, targetLength);
      }
      else {
          const twosCompliment = new BigNumber__default["default"](2)
              .pow(bitLength)
              .minus(new BigNumber__default["default"](val).abs());
          return twosCompliment.toString(16);
      }
  }
  function padHexWithZero(hex, targetLength) {
      const padString = '0';
      if (hex.length >= targetLength) {
          return hex;
      }
      else {
          const padLength = targetLength - hex.length;
          return padString.repeat(padLength) + hex;
      }
  }
  /**
   *
   * @description Strips the first 2 characters of a hex string (0x)
   *
   * @param hex string to strip prefix from
   */
  function stripHexPrefix(hex) {
      return hex.startsWith('0x') ? hex.slice(2) : hex;
  }

  exports.DeprecationError = DeprecationError;
  exports.InvalidAddressError = InvalidAddressError;
  exports.InvalidBlockHashError = InvalidBlockHashError;
  exports.InvalidChainIdError = InvalidChainIdError;
  exports.InvalidContractAddressError = InvalidContractAddressError;
  exports.InvalidHexStringError = InvalidHexStringError;
  exports.InvalidKeyError = InvalidKeyError;
  exports.InvalidKeyHashError = InvalidKeyHashError;
  exports.InvalidMessageError = InvalidMessageError;
  exports.InvalidOperationHashError = InvalidOperationHashError;
  exports.InvalidOperationKindError = InvalidOperationKindError;
  exports.InvalidProtocolHashError = InvalidProtocolHashError;
  exports.InvalidPublicKeyError = InvalidPublicKeyError;
  exports.InvalidSignatureError = InvalidSignatureError;
  exports.ProhibitedActionError = ProhibitedActionError;
  exports.VERSION = VERSION;
  exports.ValueConversionError = ValueConversionError;
  exports.b58cdecode = b58cdecode;
  exports.b58cencode = b58cencode;
  exports.b58decode = b58decode;
  exports.b58decodeL2Address = b58decodeL2Address;
  exports.buf2hex = buf2hex;
  exports.bytes2Char = bytes2Char;
  exports.char2Bytes = char2Bytes;
  exports.encodeExpr = encodeExpr;
  exports.encodeKey = encodeKey;
  exports.encodeKeyHash = encodeKeyHash;
  exports.encodeL2Address = encodeL2Address;
  exports.encodeOpHash = encodeOpHash;
  exports.encodePubKey = encodePubKey;
  exports.format = format;
  exports.getPkhfromPk = getPkhfromPk;
  exports.hex2Bytes = hex2Bytes;
  exports.hex2buf = hex2buf;
  exports.isValidPrefix = isValidPrefix;
  exports.mergebuf = mergebuf;
  exports.mic2arr = mic2arr;
  exports.num2PaddedHex = num2PaddedHex;
  exports.prefix = prefix;
  exports.prefixLength = prefixLength;
  exports.stripHexPrefix = stripHexPrefix;
  exports.toHexBuf = toHexBuf;
  exports.validateAddress = validateAddress;
  exports.validateBlock = validateBlock;
  exports.validateChain = validateChain;
  exports.validateContractAddress = validateContractAddress;
  exports.validateKeyHash = validateKeyHash;
  exports.validateOperation = validateOperation;
  exports.validatePkAndExtractPrefix = validatePkAndExtractPrefix;
  exports.validateProtocol = validateProtocol;
  exports.validatePublicKey = validatePublicKey;
  exports.validateSignature = validateSignature;
  exports.validateSpendingKey = validateSpendingKey;
  exports.verifySignature = verifySignature;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=taquito-utils.umd.js.map
