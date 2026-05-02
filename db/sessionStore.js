const session = require('express-session');

const { prisma } = require('./index');

class PostgresSessionStore extends session.Store {
  constructor(options = {}) {
    super();
    this.ttlMs = options.ttlMs || 7 * 24 * 60 * 60 * 1000;
    this.cleanupIntervalMs = options.cleanupIntervalMs || 60 * 60 * 1000;

    const timer = setInterval(() => {
      this.clearExpired().catch(() => {});
    }, this.cleanupIntervalMs);

    timer.unref();
  }

  get(sid, callback) {
    prisma.session.findFirst({
      where: {
        sid,
        expire: {
          gte: new Date(),
        },
      },
      select: {
        sess: true,
      },
    })
      .then((record) => {
        callback(null, record ? record.sess : null);
      })
      .catch((error) => callback(error));
  }

  set(sid, sess, callback = () => {}) {
    const expiresAt = this.getExpiry(sess);
    prisma.session.upsert({
      where: { sid },
      create: {
        sid,
        sess,
        expire: expiresAt,
      },
      update: {
        sess,
        expire: expiresAt,
      },
    })
      .then(() => callback(null))
      .catch((error) => callback(error));
  }

  destroy(sid, callback = () => {}) {
    prisma.session.deleteMany({ where: { sid } })
      .then(() => callback(null))
      .catch((error) => callback(error));
  }

  touch(sid, sess, callback = () => {}) {
    prisma.session.updateMany({
      where: { sid },
      data: {
        expire: this.getExpiry(sess),
      },
    })
      .then(() => callback(null))
      .catch((error) => callback(error));
  }

  async clearExpired() {
    await prisma.session.deleteMany({
      where: {
        expire: {
          lt: new Date(),
        },
      },
    });
  }

  getExpiry(sess) {
    if (sess && sess.cookie && sess.cookie.expires) {
      return new Date(sess.cookie.expires);
    }

    return new Date(Date.now() + this.ttlMs);
  }
}

module.exports = PostgresSessionStore;
