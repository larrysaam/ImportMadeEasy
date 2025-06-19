import React from 'react'
import { Input } from '@/components/ui/input'

export const NotificationSettings = ({ settings, onSettingsChange }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Email Notification Settings</h2>
      <div>
        <label className="block text-sm mb-2">Notification Email</label>
        <Input
          type="email"
          value={settings.email.notifications}
          onChange={(e) => onSettingsChange({
            ...settings,
            email: { ...settings.email, notifications: e.target.value }
          })}
          placeholder="notifications@example.com"
          className="w-full"
        />
        <p className="text-sm text-gray-500 mt-1">
          This email will receive all system notifications
        </p>
      </div>
    </div>
  )
}