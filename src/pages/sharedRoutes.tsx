// src/pages/sharedRoutes.tsx
import { lazy } from "react";
import { Route } from "react-router-dom";

// Pages that look the same in both panels.
const NotificationsPage = lazy(() => import("./NotificationsPage").then((m) => ({ default: m.NotificationsPage })));
const ProfilePage = lazy(() => import("./ProfilePage").then((m) => ({ default: m.ProfilePage })));
const EditProfilePage = lazy(() => import("./EditProfilePage").then((m) => ({ default: m.EditProfilePage })));
const SettingsPage = lazy(() => import("./SettingsPage").then((m) => ({ default: m.SettingsPage })));

// Spliced into both StudentRoutes and TeacherRoutes (<Routes> flattens fragments).
export const sharedPanelRoutes = (
  <>
    <Route path="notifications" element={<NotificationsPage />} />
    <Route path="profile" element={<ProfilePage />} />
    <Route path="profile/edit" element={<EditProfilePage />} />
    <Route path="settings" element={<SettingsPage />} />
  </>
);
