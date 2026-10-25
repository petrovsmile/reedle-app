class Statistics extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      notifications_enabled: true,
      refreshing: false,
      saving: false,
      auth_modal: false,
      period: 'week',
      load_error: false,
      statistics: null,
      goals: {
        reading_minutes_per_day: '15',
        reading_days_per_week: '5',
        books_per_month: '1',
      }
    };
    this._loadRequestId = 0;
  }

  componentDidMount() {
    this._unsubscribeFocus = this.props.stack.navigation.addListener('focus', () => this.load());
    this.load();
  }

  componentWillUnmount() {
    if (this._unsubscribeFocus) this._unsubscribeFocus();
  }

  async load(refreshing, requestedPeriod) {
    const notifications_enabled = await storage.get('push_notifications_enabled', 'false');
    this.setState({ notifications_enabled: notifications_enabled === 'true' });
    var user = appStore.current_user;
    if (!user) {
      this.setState({ loading: false, refreshing: false, statistics: null });
      return;
    }
    var period = requestedPeriod || this.state.period;
    var requestId = ++this._loadRequestId;
    this.setState({ loading: refreshing !== true, refreshing: refreshing === true, load_error: false });
    var params = {
      period: period,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    var results = await Promise.all([
      new Request('/api/v2/reading/statistics', params, { do_not_show_error: true }).get(),
      new Request('/api/v2/reading/goals', {}, { do_not_show_error: true }).get()
    ]);
    if (requestId !== this._loadRequestId) return;
    var statistics = results[0] === false ? null : results[0];
    var goals = results[1] === false ? this.state.goals : Object.assign({}, this.state.goals, results[1]);
    ['reading_minutes_per_day', 'reading_days_per_week', 'books_per_month'].forEach((key) => {
      goals[key] = String(goals[key]);
    });
    this.setState({ statistics: statistics, goals: goals, period: period, load_error: statistics === null, loading: false, refreshing: false });
  }

  setPeriod(period) {
    if (period == this.state.period) return;
    this.setState({ period: period }, () => this.load(false, period));
  }

  number(value, min, max) {
    var result = parseInt(value, 10);
    if (!Number.isFinite(result)) result = min;
    return Math.max(min, Math.min(max, result));
  }

  async saveGoals() {
    if (this.state.saving) return;
    var user = appStore.current_user;
    if (!user) return;
    var goals = {
      reading_minutes_per_day: this.number(this.state.goals.reading_minutes_per_day, 1, 240),
      reading_days_per_week: this.number(this.state.goals.reading_days_per_week, 1, 7),
      books_per_month: this.number(this.state.goals.books_per_month, 1, 30),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    this.setState({ saving: true });
    var response = await new Request('/api/v2/reading/goals', goals, { do_not_show_error: true }).put();
    this.setState({ saving: false });
    if (response === false) {
      AppAlert.alert('Не удалось сохранить цели', 'Проверьте подключение к интернету и попробуйте снова.');
      return;
    }
    AppAlert.alert('Цели сохранены');
    await progressService.loadSummary();
    this.load(true);
  }

  setGoal(key, value) {
    this.setState({ goals: Object.assign({}, this.state.goals, { [key]: value }) });
  }

  renderAuthGate() {
    return (
      <View style={statisticsStyles.authGate}>
        <Text style={[{ fontSize: 24, fontWeight: '700', textAlign: 'center' }, { color: appThemeStore.colors.text }]}>Ваш прогресс заслуживает внимания</Text>
        <Text style={[{ marginTop: 16, fontSize: 16, lineHeight: 24, textAlign: 'center' }, { color: appThemeStore.colors.mutedText }]}>Зарегистрируйтесь, чтобы сохранять историю чтения на сервере, видеть серии и достигать личных целей на всех устройствах.</Text>
        <TouchableOpacity onPress={() => this.setState({ auth_modal: true })} style={[statisticsStyles.button, { alignSelf: 'stretch', marginTop: 24, backgroundColor: app_theme_colors.red }]}>
          <Text style={{ color: app_theme_colors.inverseText, fontSize: 16, fontWeight: '600' }}>Войти или зарегистрироваться</Text>
        </TouchableOpacity>
        <Modal
          animationType="slide"
          presentationStyle="overFullScreen"
          visible={this.state.auth_modal && appStore.current_user == false}
          onRequestClose={() => this.setState({ auth_modal: false })}
          onDismiss={() => this.setState({ auth_modal: false })}>
          <Auth modal={true} close={() => this.setState({ auth_modal: false })} onSuccess={() => this.setState({ auth_modal: false }, () => this.load())} />
        </Modal>
      </View>
    );
  }

  renderMetric(value, label, wrap) {
    return (
      <View style={[statisticsStyles.metric, wrap && statisticsStyles.metricWrap]}>
        <Text style={[statisticsStyles.metricValue, { color: appThemeStore.colors.text }]}>{value || 0}</Text>
        <Text style={[statisticsStyles.metricLabel, { color: appThemeStore.colors.mutedText }]}>{label}</Text>
      </View>
    );
  }

  formatMinutes(value) {
    var minutes = Math.max(0, Number(value || 0));
    if (minutes < 60) return Math.round(minutes) + ' мин';
    var hours = Math.floor(minutes / 60);
    var rest = Math.round(minutes % 60);
    return rest > 0 ? hours + ' ч ' + rest + ' мин' : hours + ' ч';
  }

  periodTitle() {
    if (this.state.period == 'month') return 'За последние 30 дней';
    if (this.state.period == 'year') return 'За год';
    return 'За последние 7 дней';
  }

  renderPeriodSelector() {
    var periods = [
      { id: 'week', title: '7 дней' },
      { id: 'month', title: '30 дней' },
      { id: 'year', title: 'Год' }
    ];
    return (
      <View style={[statisticsStyles.periodSelector, { borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.backgroundLight }]}>
        {periods.map((period) => {
          var selected = this.state.period == period.id;
          return (
            <TouchableOpacity
              key={period.id}
              accessibilityRole="button"
              accessibilityState={{ selected: selected }}
              onPress={() => this.setPeriod(period.id)}
              style={[statisticsStyles.periodButton, selected && { backgroundColor: appThemeStore.colors.surface }]}>
              <Text style={{ color: selected ? app_theme_colors.red : appThemeStore.colors.mutedText, fontWeight: selected ? '700' : '500' }}>{period.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  renderChart(days) {
    days = Array.isArray(days) ? days : [];
    if (days.length === 0) {
      return <Text style={{ color: appThemeStore.colors.mutedText, lineHeight: 20 }}>Здесь появится график после первой отправленной сессии чтения.</Text>;
    }
    var max = Math.max(1, ...days.map(day => Number(day.minutes || 0)));
    var columnWidth = days.length > 10 ? 34 : 42;
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={statisticsStyles.chart}>
          {days.map((day, index) => (
            <View key={day.date || index} style={[statisticsStyles.chartColumn, { width: columnWidth }]}>
              <Text style={{ marginBottom: 4, fontSize: 11, color: appThemeStore.colors.mutedText }}>{Number(day.minutes || 0)}</Text>
              <View style={[statisticsStyles.chartBar, { height: Math.max(4, 96 * Number(day.minutes || 0) / max), backgroundColor: app_theme_colors.red }]} />
              <Text numberOfLines={1} style={{ marginTop: 8, fontSize: 11, color: appThemeStore.colors.mutedText }}>{day.label || ''}</Text>
            </View>
          ))}
      </ScrollView>
    );
  }

  renderGoalProgress(title, current, target, suffix) {
    current = Math.max(0, Number(current || 0));
    target = Math.max(1, Number(target || 1));
    var percent = Math.min(100, Math.round(current / target * 100));
    return (
      <View style={statisticsStyles.goalProgress}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ flex: 1, color: appThemeStore.colors.text }}>{title}</Text>
          <Text style={{ marginLeft: 12, color: appThemeStore.colors.mutedText }}>{current} из {target} {suffix}</Text>
        </View>
        <View style={[statisticsStyles.goalTrack, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
          <View style={[statisticsStyles.goalFill, { width: percent + '%', backgroundColor: percent >= 100 ? app_theme_colors.success : app_theme_colors.red }]} />
        </View>
      </View>
    );
  }

  renderField(label, key, suffix) {
    return (
      <View style={statisticsStyles.field}>
        <Text style={[statisticsStyles.fieldLabel, { color: appThemeStore.colors.text }]}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            value={this.state.goals[key]}
            onChangeText={(value) => this.setGoal(key, value.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            style={[statisticsStyles.input, { flex: 1, color: appThemeStore.colors.text, borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.backgroundLight }]}
          />
          <Text style={{ width: 96, marginLeft: 12, color: appThemeStore.colors.mutedText }}>{suffix}</Text>
        </View>
      </View>
    );
  }

  render() {
    if (appStore.current_user == false) return this.renderAuthGate();
    if (this.state.loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={appThemeStore.colors.mutedText} />;

    var statistics = this.state.statistics || {};
    var today = statistics.today || {};
    var streak = statistics.streak || {};
    var points = statistics.points || statistics.days || [];
    var totals = Object.assign({}, statistics.totals || {});
    if (totals.minutes == undefined) totals.minutes = points.reduce((sum, point) => sum + Number(point.minutes || 0), 0);
    var goalsProgress = statistics.goals_progress || {};
    var readingDays = goalsProgress.reading_days || {};
    var completedBooks = goalsProgress.books || {};
    var goalMinutes = Number(this.state.goals.reading_minutes_per_day || 1);
    var progress = Math.min(100, Math.round(Number(today.minutes || 0) / Math.max(1, goalMinutes) * 100));

    return (
      <AppSafeAreaView style={[applicationStyles.save_area_view, { backgroundColor: appThemeStore.colors.background }]}>
        <ScrollView
          refreshControl={<RefreshControl refreshing={this.state.refreshing} onRefresh={() => this.load(true)} />}
          contentContainerStyle={statisticsStyles.content}>
          {this.renderPeriodSelector()}

          {this.state.load_error &&
            <View style={[statisticsStyles.errorCard, { borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.surface }]}>
              <Text style={{ color: appThemeStore.colors.text, fontWeight: '600' }}>Не удалось загрузить статистику</Text>
              <Text style={{ marginTop: 6, color: appThemeStore.colors.mutedText }}>Проверьте подключение и попробуйте ещё раз.</Text>
              <TouchableOpacity onPress={() => this.load(false)} style={{ marginTop: 12 }}><Text style={{ color: app_theme_colors.red, fontWeight: '600' }}>Повторить</Text></TouchableOpacity>
            </View>
          }

          <View style={[statisticsStyles.card, { borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.surface }]}>
            <Text style={[statisticsStyles.cardTitle, { color: appThemeStore.colors.text }]}>Сегодня</Text>
            <View style={statisticsStyles.metrics}>
              {this.renderMetric(today.minutes, 'минут')}
              {this.renderMetric(today.pages, 'страниц')}
              {this.renderMetric(today.words_added, 'новых слов')}
            </View>
            <Text style={{ marginTop: 20, marginBottom: 8, color: appThemeStore.colors.mutedText }}>{progress}% дневной цели</Text>
            <View style={[statisticsStyles.progressTrack, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
              <View style={[statisticsStyles.progressFill, { width: progress + '%', backgroundColor: app_theme_colors.red }]} />
            </View>
          </View>

          <View style={[statisticsStyles.card, { borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.surface }]}>
            <Text style={[statisticsStyles.cardTitle, { color: appThemeStore.colors.text }]}>{this.periodTitle()}</Text>
            <View style={statisticsStyles.metricsWrap}>
              {this.renderMetric(this.formatMinutes(totals.minutes), 'время чтения', true)}
              {this.renderMetric(totals.pages, 'страниц', true)}
              {this.renderMetric(totals.words_added, 'новых слов', true)}
              {this.renderMetric(totals.sessions, 'сессий', true)}
            </View>
          </View>

          <View style={[statisticsStyles.card, { borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.surface }]}>
            <Text style={[statisticsStyles.cardTitle, { color: appThemeStore.colors.text }]}>Регулярность</Text>
            <View style={statisticsStyles.metrics}>
              {this.renderMetric(streak.current_days, 'дней подряд')}
              {this.renderMetric(streak.best_days, 'лучшая серия')}
              {this.renderMetric(statistics.books_completed, 'книг завершено')}
            </View>
          </View>

          <View style={[statisticsStyles.card, { borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.surface }]}>
            <Text style={[statisticsStyles.cardTitle, { color: appThemeStore.colors.text }]}>Активность</Text>
            {this.renderChart(points)}
          </View>

          <View style={[statisticsStyles.card, { borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.surface }]}>
            <Text style={[statisticsStyles.cardTitle, { color: appThemeStore.colors.text }]}>Прогресс целей</Text>
            {this.renderGoalProgress('Активные дни на этой неделе', readingDays.current, readingDays.target || this.state.goals.reading_days_per_week, 'дн.')}
            {this.renderGoalProgress('Законченные книги в этом месяце', completedBooks.current, completedBooks.target || this.state.goals.books_per_month, 'шт.')}
          </View>

          <View style={[statisticsStyles.card, { borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.surface }]}>
            <Text style={[statisticsStyles.cardTitle, { color: appThemeStore.colors.text }]}>Мои цели</Text>
            {this.renderField('Читать каждый день', 'reading_minutes_per_day', 'минут')}
            {this.renderField('Активных дней в неделю', 'reading_days_per_week', 'дней')}
            {this.renderField('Заканчивать за месяц', 'books_per_month', 'книг')}
            <TouchableOpacity disabled={this.state.saving} onPress={() => this.saveGoals()} style={[statisticsStyles.button, { backgroundColor: app_theme_colors.red, opacity: this.state.saving ? 0.6 : 1 }]}>
              {this.state.saving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '600' }}>Сохранить цели</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.props.stack.navigation.navigate('notification_settings', { backTitle: 'Статистика' })} style={[statisticsStyles.button, { borderWidth: 1, borderColor: appThemeStore.colors.border, marginTop: 12 }]}>
              <Text style={{ color: appThemeStore.colors.text, fontWeight: '600' }}>Настроить уведомления о целях</Text>
            </TouchableOpacity>
            {(!this.state.notifications_enabled || this.state.goals.reminder_enabled === false) && (
              <Text style={{ marginTop: 12, color: appThemeStore.colors.mutedText, lineHeight: 20 }}>
                <Text style={{ color: app_theme_colors.red }}>Уведомления выключены!</Text>
                {'\nВключите их, чтобы следить за выполнением целей!'}
              </Text>
            )}

          </View>
        </ScrollView>
      </AppSafeAreaView>
    );
  }
}
