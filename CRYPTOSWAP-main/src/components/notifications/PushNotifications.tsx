import React, { useEffect, useState } from 'react';
import { NotificationService } from '@/services/notifications/NotificationService';
import { Button, Switch, FormControlLabel, Typography, Box, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';

export const PushNotifications: React.FC = () => {
  const { t } = useTranslation();
  const [isEnabled, setIsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones push');
      return;
    }

    const permission = Notification.permission;
    setPermission(permission);
    setIsEnabled(permission === 'granted');
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      setIsEnabled(permission === 'granted');

      if (permission === 'granted') {
        await notificationService.registerPushSubscription();
      }
    } catch (error) {
      console.error('Error al solicitar permiso:', error);
    }
  };

  const toggleNotifications = async () => {
    if (!isEnabled) {
      await requestPermission();
    } else {
      await notificationService.unregisterPushSubscription();
      setIsEnabled(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t('notifications.title')}
      </Typography>

      {!('Notification' in window) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('notifications.browserNotSupported')}
        </Alert>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={isEnabled}
            onChange={toggleNotifications}
            disabled={!('Notification' in window)}
          />
        }
        label={t('notifications.enablePush')}
      />

      {permission === 'denied' && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {t('notifications.permissionDenied')}
        </Alert>
      )}

      {permission === 'default' && (
        <Button
          variant="contained"
          color="primary"
          onClick={requestPermission}
          sx={{ mt: 2 }}
        >
          {t('notifications.requestPermission')}
        </Button>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('notifications.description')}
      </Typography>
    </Box>
  );
}; 