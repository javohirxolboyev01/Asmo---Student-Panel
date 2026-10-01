// src/pages/sharedRoutes.tsx
import { Route } from "react-router-dom";
import { lazyPage } from "@/lib/lazyPage";

// Pages that look the same in both panels.
export const sharedPages = {
  NotificationsPage: lazyPage(() => import("./NotificationsPage"), "NotificationsPage"),
  ProfilePage: lazyPage(() => import("./ProfilePage"), "ProfilePage"),
  EditProfilePage: lazyPage(() => import("./EditProfilePage"), "EditProfilePage"),
  SettingsPage: lazyPage(() => import("./SettingsPage"), "SettingsPage"),
};

// Spliced into both StudentRoutes and TeacherRoutes (<Routes> flattens fragments).
export const sharedPanelRoutes = (
  <>
    <Route path="notifications" element={<sharedPages.NotificationsPage />} />
    <Route path="profile" element={<sharedPages.ProfilePage />} />
    <Route path="profile/edit" element={<sharedPages.EditProfilePage />} />
    <Route path="settings" element={<sharedPages.SettingsPage />} />
  </>
);
