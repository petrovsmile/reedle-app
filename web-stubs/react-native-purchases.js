export const LOG_LEVEL = {
  VERBOSE: 'VERBOSE',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

const Purchases = {
  setLogLevel() {},
  configure() {},
  async syncPurchases() {},
  async getCustomerInfo() {
    return { entitlements: { active: {} } };
  },
  async getProducts(productIds = []) {
    return productIds.map(identifier => ({ identifier, productId: identifier }));
  },
  async purchaseStoreProduct() {
    return { customerInfo: { entitlements: { active: {} } } };
  },
};

export default Purchases;
