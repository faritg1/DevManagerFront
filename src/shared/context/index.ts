export { AuthProvider, useAuth, type User, type AuthState } from './AuthContext';
export { NotificationProvider, useNotification, useToast, type Notification, type NotificationType } from './NotificationContext';
export { ConfirmProvider } from './ConfirmContext'; // useConfirm is exported from hooks to avoid duplicate names
export { ConfigContext, ConfigProvider, useConfig } from './ConfigContext';