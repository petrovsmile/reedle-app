const statisticsStyles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 48,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 18,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricWrap: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: '50%',
  },
  metricValue: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },
  metricLabel: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    borderRadius: 5,
  },
  chart: {
    height: 144,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  chartColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 144,
  },
  goalProgress: {
    marginBottom: 18,
  },
  goalTrack: {
    height: 8,
    marginTop: 10,
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalFill: {
    height: 8,
    borderRadius: 4,
  },
  chartBar: {
    width: 20,
    minHeight: 4,
    borderRadius: 4,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  button: {
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authGate: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
