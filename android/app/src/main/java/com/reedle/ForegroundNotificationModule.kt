package com.reedle

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONObject

class ForegroundNotificationModule(private val react_context: ReactApplicationContext) :
  ReactContextBaseJavaModule(react_context), ActivityEventListener {
  init { react_context.addActivityEventListener(this) }

  override fun getName() = "ForegroundNotification"

  @ReactMethod
  fun showNotification(title: String, body: String, data: ReadableMap, promise: Promise) {
    try {
      val manager = react_context.getSystemService(NotificationManager::class.java)
      if ((Build.VERSION.SDK_INT >= 33 && react_context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) || !manager.areNotificationsEnabled()) {
        promise.resolve(false)
        return
      }
      val channel_id = "reedle_messages"
      if (Build.VERSION.SDK_INT >= 26) {
        manager.createNotificationChannel(NotificationChannel(channel_id, "Уведомления Reedle", NotificationManager.IMPORTANCE_HIGH))
      }
      if (Build.VERSION.SDK_INT >= 26 && manager.getNotificationChannel(channel_id).importance == NotificationManager.IMPORTANCE_NONE) {
        promise.resolve(false)
        return
      }
      val notification_id = data.toHashMap()["notification_id"]?.toString()?.hashCode() ?: System.currentTimeMillis().toInt()
      val intent = Intent(react_context, MainActivity::class.java)
        .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        .putExtra("reedle_notification_data", JSONObject(data.toHashMap()).toString())
      val pending_intent = PendingIntent.getActivity(react_context, notification_id, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      val notification = NotificationCompat.Builder(react_context, channel_id)
        .setSmallIcon(R.drawable.ic_notification)
        .setContentTitle(title)
        .setContentText(body)
        .setStyle(NotificationCompat.BigTextStyle().bigText(body))
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setDefaults(android.app.Notification.DEFAULT_ALL)
        .setContentIntent(pending_intent)
        .setAutoCancel(true)
        .build()
      manager.notify(notification_id, notification)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("notification_failed", error)
    }
  }

  private fun consumeNotification(intent: Intent?): WritableMap? {
    val payload = intent?.getStringExtra("reedle_notification_data") ?: return null
    intent.removeExtra("reedle_notification_data")
    val json = JSONObject(payload)
    val data = Arguments.createMap()
    json.keys().forEach { key -> data.putString(key, json.get(key).toString()) }
    return Arguments.createMap().apply { putMap("data", data) }
  }

  @ReactMethod
  fun getInitialNotification(promise: Promise) {
    promise.resolve(consumeNotification(react_context.currentActivity?.intent))
  }

  override fun onNewIntent(intent: Intent) {
    val message = consumeNotification(intent) ?: return
    react_context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("reedleNotificationOpened", message)
  }

  override fun onActivityResult(activity: android.app.Activity, requestCode: Int, resultCode: Int, data: Intent?) {}
}
