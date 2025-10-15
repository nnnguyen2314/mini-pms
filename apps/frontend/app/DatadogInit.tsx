"use client";

import { useEffect } from 'react';
import { datadogRum } from '@datadog/browser-rum';
import { datadogLogs } from '@datadog/browser-logs';

export default function DatadogInit() {
  useEffect(() => {
    const clientToken = process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN;
    const applicationId = process.env.NEXT_PUBLIC_DD_APPLICATION_ID || process.env.NEXT_PUBLIC_DD_APP_ID;
    const site = process.env.NEXT_PUBLIC_DD_SITE || 'datadoghq.com';
    const service = process.env.NEXT_PUBLIC_DD_SERVICE || 'mini-pms-frontend';
    const env = process.env.NEXT_PUBLIC_DD_ENV || process.env.NODE_ENV || 'development';

    // Only initialize if token and app ID provided
    if (clientToken && applicationId) {
      // Initialize RUM
      if (!(datadogRum as any)._isAlreadyInitialized) {
        datadogRum.init({
          applicationId,
          clientToken,
          site,
          service,
          env,
          sessionSampleRate: Number(process.env.NEXT_PUBLIC_DD_SAMPLE_RATE || 100),
          sessionReplaySampleRate: Number(process.env.NEXT_PUBLIC_DD_REPLAY_SAMPLE_RATE || 20),
          trackUserInteractions: true,
          trackResources: true,
          trackLongTasks: true,
          defaultPrivacyLevel: (process.env.NEXT_PUBLIC_DD_PRIVACY as any) || 'mask-user-input',
          // If you use Next.js router, enable view tracking
          trackViewsManually: false,
        });
        datadogRum.startSessionReplayRecording();
        (datadogRum as any)._isAlreadyInitialized = true;
      }

      // Initialize Browser Logs
      if (!(datadogLogs as any)._isAlreadyInitialized) {
        datadogLogs.init({
          clientToken,
          site,
          service,
          env,
          forwardErrorsToLogs: true,
          sessionSampleRate: Number(process.env.NEXT_PUBLIC_DD_LOGS_SAMPLE_RATE || 100),
        });
        (datadogLogs as any)._isAlreadyInitialized = true;
      }
    }
  }, []);

  return null;
}
