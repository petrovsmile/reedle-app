class Storage {
  async get(key, default_value) {
    var value = await AsyncStorage.getItem(key);
    if (value == undefined || value == null) {
      value = default_value;
      this.set(key, default_value);
    }
    return value;
  }

  async set(key, value) {
    if (value == undefined) {
      value = '';
    }

    var value = await AsyncStorage.setItem(key, value.toString());
    return value;
  }

  async remove(key) {
    await AsyncStorage.removeItem(key);
  }
}