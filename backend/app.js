// ...existing imports...
import settingRoute from './routes/settingRoute.js';

// ...existing middleware setup...

// Add this line with your other route declarations
app.use('/api/settings', settingRoute);