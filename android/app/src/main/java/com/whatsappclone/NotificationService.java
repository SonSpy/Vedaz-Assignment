package com.whatsappclone;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class NotificationService extends FirebaseMessagingService {
    private static final String CHANNEL_ID = "popup_channel"; // 👈 NEW unique ID to avoid conflicts

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        String title = "Notification";
        String body = "You have a new message!";
        if (remoteMessage.getNotification() != null) {
            if (remoteMessage.getNotification().getTitle() != null) {
                title = remoteMessage.getNotification().getTitle();
            }
            if (remoteMessage.getNotification().getBody() != null) {
                body = remoteMessage.getNotification().getBody();
            }
        }
        showNotification(title, body);
    }

    private void showNotification(String title, String message) {
        NotificationManager notificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

        // Create high-importance channel (for heads-up)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Popup Channel",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Shows popup notifications for calls/messages");
            channel.enableVibration(true);
            channel.enableLights(true);
            Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            channel.setSound(sound, null);
            notificationManager.createNotificationChannel(channel);
        }

        // Intent to open MainActivity
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            getApplicationContext(),
            0,
            intent,
            PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
        );

        // Build the notification
        NotificationCompat.MessagingStyle messagingStyle =
    new NotificationCompat.MessagingStyle("You")
        .addMessage(message, System.currentTimeMillis(), "Sender");

NotificationCompat.Builder builder = new NotificationCompat.Builder(getApplicationContext(), CHANNEL_ID)
    .setStyle(messagingStyle)
    .setSmallIcon(R.mipmap.ic_launcher)
    .setAutoCancel(true)
    .setPriority(NotificationCompat.PRIORITY_HIGH)
    .setDefaults(NotificationCompat.DEFAULT_ALL)
    .setContentIntent(pendingIntent);


        // Show notification
        notificationManager.notify(0, builder.build());
    }
}
