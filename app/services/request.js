let pwaCsrfToken = null;

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
      var headers = await this.authorizationHeaders();

      try {
        if (method == 'get') {
          var response = await axios.get(url, {
            signal: this.AbortSignal(10_000),
            params: this.params,
            headers: headers,
            withCredentials: Platform.OS === 'web' || this.options.with_credentials === true
          });
        }

        if (method == 'post') {
          var response = await axios.post(url,
            this.params,
            {
              signal: this.AbortSignal(10_000),
              headers: headers,
              withCredentials: Platform.OS === 'web' || this.options.with_credentials === true
            }
          );
        }

        if (method == 'put') {
          var response = await axios.put(url,
            this.params,
            {
              signal: this.AbortSignal(10_000),
              headers: headers,
              withCredentials: Platform.OS === 'web' || this.options.with_credentials === true
            }
          );
        }

        if (method == 'delete') {
          var response = await axios.delete(url,
            {
              signal: this.AbortSignal(10_000),
              headers: headers,
              withCredentials: Platform.OS === 'web' || this.options.with_credentials === true,
              data: this.params
            },
          );
        }


        var data = response.data['response'] != undefined ? response.data['response'] : response.data;
        this.captureCsrfToken(response);
        await this.captureAccessToken(data);
        if (this.options.detailed_response == true) {
          return { ok: true, status: response.status, data: data };
        }
        return data;

      } catch (e) {
        this.captureCsrfToken(e.response);
        await this.handleAuthorizationError(e, headers);
        if (this.options.do_not_show_error != true) {
          appStore.showError('Нет подключения к серверу', this.options.desciption_error);
        }
        if (this.options.detailed_response == true) {
          return {
            ok: false,
            status: e.response ? e.response.status : 0,
            data: e.response && e.response.data ? e.response.data.response : null
          };
        }
        return false;
      }

    } else {
      if (this.options.do_not_show_error != true) {
        appStore.showError('Отсутствует подключение к интернету', this.options.desciption_error);
      }
      if (this.options.detailed_response == true) {
        return { ok: false, status: 0, data: null };
      }
      return false;
    }
  }

  async authorizationHeaders() {
    var headers = { 'X-Client-Platform': Platform.OS };

    if (Platform.OS === 'web') {
      if (pwaCsrfToken) headers['X-CSRF-Token'] = pwaCsrfToken;
      return headers;
    }

    var accessToken = await new Storage().get('access_token');
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return headers;
  }

  async captureAccessToken(data) {
    if (!data || !data.access_token) return;

    if (Platform.OS !== 'web') {
      await new Storage().set('access_token', data.access_token);
    }
    delete data.access_token;
  }

  captureCsrfToken(response) {
    if (Platform.OS !== 'web' || !response || !response.headers) return;

    var token = response.headers['x-csrf-token'];
    if (token) pwaCsrfToken = token;
  }

  async handleAuthorizationError(error, headers) {
    if (!error.response || error.response.status != 401) return;
    if (!headers.Authorization && Platform.OS !== 'web') return;

    await clearAuthenticationState();
  }
}
