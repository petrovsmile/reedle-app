class Request {
  constructor(url, params, options) {
    this.url = url;
    this.params = params;
    if (options == undefined) {
      this.options = {};
    } else {
      this.options = options;
    }
  }

  async get() {
    return await this.makeRequest('get');
  }

  async post() {
    return await this.makeRequest('post');
  }

  async put() {
    return await this.makeRequest('put');
  }

  async delete() {
    return await this.makeRequest('delete');
  }

  AbortSignal(timeoutMs) {
    const abortController = new AbortController();
    setTimeout(() => abortController.abort(), timeoutMs || 0);
  
    return abortController.signal;
  }

  async makeRequest(method) {
    if (appStore.has_internet) {
      let url = HOST + this.url;

      try {
        if (method == 'get') {
          var response = await axios.get(url, { signal: this.AbortSignal(5000), params: this.params });
        }

        if (method == 'post') {
          var response = await axios.post(url,
            this.params,
            {
              signal: this.AbortSignal(5000),
              headers: { Authorization: `Bearer ${API_TOKEN}` }
            }
          );
        }

        if (method == 'put') {
          var response = await axios.put(url,
            this.params,
            {
              signal: this.AbortSignal(5000),
              headers: { Authorization: `Bearer ${API_TOKEN}` }
            }
          );
        }

        if (method == 'delete') {
          var response = await axios.delete(url,
            {
              signal: this.AbortSignal(5000),
              headers: { Authorization: `Bearer ${API_TOKEN}` },
              data: this.params
            },
          );
        }

        if (response.data['response'] != undefined) {
          return response.data['response'];
        } else {
          return response.data;
        }

      } catch (e) {
        if (this.options.do_not_show_error != true) {
          appStore.showError('Ошибка подключения к серверу', this.options.desciption_error);
        }
        return false;
      }

    } else {
      if (this.options.do_not_show_error != true) {
        appStore.showError('Отсутствует подключение к интернету', this.options.desciption_error);
      }
      return false;
    }
  }
}