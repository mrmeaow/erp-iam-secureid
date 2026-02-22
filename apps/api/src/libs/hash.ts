import argon2 from '@node-rs/argon2';

export class Hash {
  /// Hash :: make() => hash a value or password
  static async make(payload: string) {
    return await argon2.hash(payload);
  }

  /// Hash :: verify() => verify a hashed value
  static async verify(hash: string, origin: string) {
    return await argon2.verify(hash, origin);
  }
}
