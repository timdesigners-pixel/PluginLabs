package com.pluginlabs.hub;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;

import org.json.JSONException;
import org.json.JSONObject;

/** Android paket yükleyicisinin sonucunu arayüze iletir. */
public class InstallResultReceiver extends BroadcastReceiver {
    @SuppressWarnings("deprecation")
    @Override
    public void onReceive(Context context, Intent intent) {
        String id = intent.getStringExtra(ApkInstaller.EXTRA_ID);
        if (id == null) id = "";
        int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);

        if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
            Intent confirm = intent.getParcelableExtra(Intent.EXTRA_INTENT);
            if (confirm != null) {
                confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                try {
                    context.startActivity(confirm);
                } catch (Exception e) {
                    ApkInstaller.deliverResult(ApkInstaller.event(id, "error", "Kurulum onay ekranı açılamadı"));
                }
            }
            return;
        }

        JSONObject e;
        if (status == PackageInstaller.STATUS_SUCCESS) {
            e = ApkInstaller.event(id, "installed", "Kuruldu");
        } else if (status == PackageInstaller.STATUS_FAILURE_ABORTED) {
            e = ApkInstaller.event(id, "cancelled", "Kurulum iptal edildi");
        } else {
            String msg = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
            e = ApkInstaller.event(id, "error", msg == null ? "Kurulum başarısız" : msg);
        }
        try {
            e.put("package", intent.getStringExtra(PackageInstaller.EXTRA_PACKAGE_NAME));
        } catch (JSONException ignored) {
        }
        ApkInstaller.deliverResult(e);
    }
}
