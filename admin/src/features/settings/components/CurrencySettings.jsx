import { Input } from '@/components/ui/input'

export const CurrencySettings = ({ settings, onSettingsChange }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Currency Settings</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2">Currency Name</label>
          <Input
            value={settings.currency.name}
            onChange={(e) => onSettingsChange({
              ...settings,
              currency: { ...settings.currency, name: e.target.value }
            })}
            placeholder="USD"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">Currency Sign</label>
          <Input
            value={settings.currency.sign}
            onChange={(e) => onSettingsChange({
              ...settings,
              currency: { ...settings.currency, sign: e.target.value }
            })}
            placeholder="$"
          />
        </div>
      </div>
    </div>
  )
}