// src/main.jsx - UPDATED VERSION
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { SupabaseProvider } from './context/SupabaseContext.jsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.jsx'

console.log('=== MOUNT PLATFORM STARTING ===')

// Enhanced Service Worker Registration
function registerServiceWorkers() {
  if ('serviceWorker' in navigator) {
    console.log('🔧 Service Worker API available');

    // Wait a bit for OneSignal to initialize
    setTimeout(() => {
      console.log('🔄 Starting Service Worker registration...');

      // UNREGISTER any existing workers first (clean slate)
      navigator.serviceWorker.getRegistrations().then(registrations => {
        if (registrations.length > 0) {
          console.log(`Found ${registrations.length} existing registrations, unregistering...`);
          return Promise.all(registrations.map(reg => reg.unregister()));
        }
        return Promise.resolve();
      }).then(() => {
        console.log('📝 Registering OneSignal Service Worker...');

        // Register OneSignal's Service Worker FIRST (most important)
        return navigator.serviceWorker.register('/OneSignalSDKWorker.js', {
          scope: '/',
          updateViaCache: 'none'
        });
      }).then(oneSignalRegistration => {
        console.log('✅ OneSignal Service Worker registered:', oneSignalRegistration.scope);

        // Wait for it to activate
        if (oneSignalRegistration.installing) {
          console.log('⏳ OneSignal SW installing...');
          return new Promise(resolve => {
            oneSignalRegistration.installing.addEventListener('statechange', e => {
              if (e.target.state === 'activated') {
                console.log('✅ OneSignal SW activated');
                resolve(oneSignalRegistration);
              }
            });
          });
        }

        return oneSignalRegistration;
      }).then(oneSignalRegistration => {
        console.log('📝 Now registering custom Service Worker...');

        // Register custom worker
        return navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
      }).then(customRegistration => {
        console.log('✅ Custom Service Worker registered:', customRegistration.scope);

        // Check final state
        return navigator.serviceWorker.ready;
      }).then(() => {
        console.log('🎉 All Service Workers registered and ready!');

        // Check if we have a controller
        if (navigator.serviceWorker.controller) {
          console.log('🎮 Service Worker is controlling the page');
        }

        // Now trigger OneSignal subscription if needed
        setTimeout(() => {
          if (window.triggerOneSignalSubscription) {
            console.log('🎯 Attempting to trigger OneSignal subscription...');
            window.triggerOneSignalSubscription();
          }
        }, 2000);

      }).catch(error => {
        console.error('❌ Service Worker registration failed:', error);

        // Fallback: Try just registering OneSignal worker
        navigator.serviceWorker.register('/OneSignalSDKWorker.js')
          .then(reg => {
            console.log('✅ OneSignal SW registered (fallback):', reg.scope);
          })
          .catch(err => {
            console.error('❌ Fallback registration failed:', err);
          });
      });
    }, 1000); // Wait 1 second before starting
  } else {
    console.log('❌ Service Worker API not supported');
  }
}

// Register Service Workers on app start
registerServiceWorkers(); n
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SupabaseProvider>
      <App />
    </SupabaseProvider>
  </React.StrictMode>,
)