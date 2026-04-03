const socketRegistry = {
  byUserId: new Map(),
  byVisitorToken: new Map()
};

export function registerAgent(userId, socketId) {
  socketRegistry.byUserId.set(String(userId), socketId);
}

export function unregisterAgent(userId, socketId) {
  const current = socketRegistry.byUserId.get(String(userId));
  if (current === socketId) socketRegistry.byUserId.delete(String(userId));
}

export function registerVisitor(visitorToken, socketId) {
  socketRegistry.byVisitorToken.set(String(visitorToken), socketId);
}

export function unregisterVisitor(visitorToken, socketId) {
  const current = socketRegistry.byVisitorToken.get(String(visitorToken));
  if (current === socketId) socketRegistry.byVisitorToken.delete(String(visitorToken));
}
