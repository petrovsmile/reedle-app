class AppAlertService {
  handler = null;

  alert(title, message, buttons, on_shown) {
    if (this.handler) {
      var modalButtons = buttons && buttons.length ? buttons.slice() : [{ text: 'Понятно' }];
      modalButtons.sort((left, right) => Number(left.style == 'cancel') - Number(right.style == 'cancel'));
      this.handler({
        title: title || '',
        message: message || '',
        buttons: modalButtons,
        on_shown: on_shown
      });
    }
  }

  confirm(title, message, onConfirm, confirmText) {
    this.alert(title, message, [
      { text: confirmText || 'Подтвердить', style: 'destructive', onPress: onConfirm },
      { text: 'Отмена', style: 'cancel' }
    ]);
  }
}
