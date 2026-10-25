class ProgressStore {
  summary = null;
  summary_loading = false;
  notification = null;

  constructor() {
    makeAutoObservable(this);
  }

  setSummary(value) { this.summary = value; }
  setSummaryLoading(value) { this.summary_loading = value; }
  setNotification(value) { this.notification = value; }
  dismissNotification() { this.notification = null; }
}

