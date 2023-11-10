"use strict";

const shopModel = require("../models/shop.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const keyTokenService = require("./keyToken.service");
const { createTokenPair, verifyJWT } = require("../auth/authUtils");
const { getInforData } = require("../utils");
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
} = require("../core/error.response");
const { findByEmail } = require("./shop.service");

const RoleShop = {
  SHOP: "SHOP",
  WRITTER: "WRITTER",
  EDITOR: "EDITOR",
  ADMIN: "ADMIN",
};

class AccessService {
  // check this token used ?
  static handleRefreshToken = async (refreshToken) => {
    // check token đã dc sử dụng chưa ?
    const foundToken = await keyTokenService.findByRefreshTokenUsed(
      refreshToken
    );

    // nếu có
    if (foundToken) {
      // decode xem may la thang nao?
      const { userId, email } = await verifyJWT(
        refreshToken,
        foundToken.privateKey
      );

      console.log(userId, email);

      // xóa tất cả token trong keyStore
      await keyTokenService.deleteKeyById(userId);
      throw new ForbiddenError("Something wrong happend !! Pls relogin");
    }

    // chưa có , ngon
    const holderToken = await keyTokenService.findByRefreshToken(refreshToken);
    if (!holderToken) throw new AuthFailureError("Shop not registered 1");

    // verifyToken
    const { userId, email } = await verifyJWT(
      refreshToken,
      holderToken.privateKey
    );

    // check userid
    const shopUser = await findByEmail({ email });
    if (!shopUser) throw new AuthFailureError("Shop not registered 2");

    // create 1 cap token moi
    const tokens = await createTokenPair(
      { userId, email },
      holderToken.publicKey,
      holderToken.privateKey
    );

    // update token
    await holderToken.updateOne({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addToSet: {
        refreshTokenUsed: refreshToken, // đã dc sử dụng để lấy token mới rồi
      },
    });

    return {
      user: { userId, email },
      tokens,
    };
  };

  static logout = async (keyStore) => {
    const delKey = await keyTokenService.removeKeyById(keyStore._id);
    return delKey;
  };

  static login = async ({ email, password, refreshToken = null }) => {
    const foundShop = await findByEmail({ email });

    //1 Check email in dbs
    if (!foundShop) {
      throw new BadRequestError("Error: Shop not registered!");
    }

    //2 match password
    const match = bcrypt.compare(password, foundShop.password);
    if (!match) {
      throw new AuthFailureError("Authentication Error");
    }

    //3 create AT vs RT and save
    const privateKey = crypto.randomBytes(64).toString("hex");
    const publicKey = crypto.randomBytes(64).toString("hex");

    //4 generate tokens
    const { _id: userId } = foundShop;
    const tokens = await createTokenPair(
      { userId, email },
      publicKey,
      privateKey
    );

    await keyTokenService.createKeyToken({
      userId,
      refreshToken: tokens.refreshToken,
      privateKey,
      publicKey,
    });

    // 5  get data return login
    return {
      metadata: {
        shop: getInforData({
          fileds: ["_id", "name", "email"],
          object: foundShop,
        }),
        tokens,
      },
    };
  };

  static signUp = async ({ name, email, password }) => {
    // step1: check email exits??
    const hodelShop = await shopModel.findOne({ email }).lean();
    if (hodelShop) {
      throw new BadRequestError("Error: Shop already register!");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newShop = await shopModel.create({
      name,
      email,
      password: passwordHash,
      roles: [RoleShop.SHOP],
    });

    if (newShop) {
      // create privateKey, publicKey
      // const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
      //   modulusLength: 4096,
      //   privateKeyEncoding: {
      //     type: "pkcs1",
      //     format: "pem",
      //   },

      //   publicKeyEncoding: {
      //     type: "pkcs1",
      //     format: "pem",
      //   },
      // });
      const privateKey = crypto.randomBytes(64).toString("hex");
      const publicKey = crypto.randomBytes(64).toString("hex");

      const keyStore = await keyTokenService.createKeyToken({
        userId: newShop._id,
        publicKey,
        privateKey,
      });

      if (!keyStore) {
        throw new BadRequestError("Error: PublicKeyString error!");
      }

      // const publicKeyObject = crypto.createPublicKey(publicKeyString);

      // create token pair
      const tokens = await createTokenPair(
        { userId: newShop._id, email },
        publicKey,
        privateKey
      );

      return {
        code: 201,
        metadata: {
          shop: getInforData({
            fileds: ["_id", "name", "email"],
            object: newShop,
          }),
          tokens,
        },
      };
    }

    return {
      code: 200,
      metadata: null,
    };
  };
}

module.exports = AccessService;
