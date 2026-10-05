// src/pages/sharedRoutes.tsx
import { Navigate, Route } from "react-router-dom";
import { lazyPage } from "@/lib/lazyPage";

// Account pages of the teacher panel (the profile itself lives on "Ko'proq").
export const sharedPages = {
  NotificationsPage: lazyPage(() => import("./NotificationsPage"), "NotificationsPage"),
  EditProfilePage: lazyPage(() => import("./EditProfilePage"), "EditProfilePage"),
  SettingsPage: lazyPage(() => import("./SettingsPage"), "SettingsPage"),
};

// Spliced into TeacherRoutes (<Routes> flattens fragments).
export const sharedPanelRoutes = (
  <>
    <Route path="notifications" element={<sharedPages.NotificationsPage />} />
    <Route path="profile" element={<Navigate to="/more" replace />} />
    <Route path="profile/edit" element={<sharedPages.EditProfilePage />} />
    <Route path="settings" element={<sharedPages.SettingsPage />} />
  </>
);
