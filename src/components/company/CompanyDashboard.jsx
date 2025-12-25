// src/components/company/CompanyDashboard.jsx — MODERN REDESIGN (FIXED)
import React from 'react'
import { useSupabase } from '../../context/SupabaseContext'
import { useState, useEffect, useRef, useCallback } from 'react'
import ProfileSection from './ProfileSection'
import JobsSection from './JobsSection'
import logo from '../../assets/logo.png';
import OneSignalService from "../../services/OneSignalService";

export default function CompanyDashboard() {
  const { user, signOut, supabase } = useSupabase()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [activePanel, setActivePanel] = useState('dashboard')
  const [notifications, setNotifications] = useState([])
  const [stats, setStats] = useState({
    pendingJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalReviews: 0
  })

  // REAL-TIME JOB COUNT
  const [pendingJobCount, setPendingJobCount] = useState(0)
  const [hasNewJobs, setHasNewJobs] = useState(false)
  const previousCountRef = useRef(0)

  // Define loadNotifications function with useCallback to prevent dependency issues
  const loadNotifications = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
    }

  }, [user, supabase])

  // In CompanyDashboard.jsx, update the OneSignal section:
  // In CompanyDashboard.jsx, update the OneSignal useEffect:
  useEffect(() => {
    const setupOneSignal = async () => {
      if (!user?.id) return;

      console.log('🔔 Setting up OneSignal for user:', user.id);

      // Add delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const initialized = await OneSignalService.initialize(user.id);

        if (initialized) {
          console.log('✅ OneSignal setup complete');
          // After OneSignal initialization
          const oneSignalSuccess = await OneSignalService.initialize(userId);
          if (!oneSignalSuccess) {
            console.log('⚠️ OneSignal not ready, trying manual subscription...');
            await OneSignalService.subscribeUser();
          }
          const debugOneSignal = async () => {
            console.log('=== ONESIGNAL DEBUG ===');
            console.log('Window.OneSignal:', window.OneSignal);
            console.log('Notification.permission:', Notification.permission);

            if (window.OneSignal) {
              const oneSignal = window.OneSignal;
              console.log('OneSignal.User:', oneSignal.User);
              console.log('OneSignal.User.id:', await oneSignal.User.id);
              console.log('OneSignal.User.PushSubscription:', oneSignal.User.PushSubscription);
              console.log('OneSignal.User.PushSubscription.id:', await oneSignal.User.PushSubscription.id);
            }
          };
          // Optional: Save player ID to database
          setTimeout(async () => {
            const playerId = await OneSignalService.getPlayerId();
            if (playerId) {
              console.log('📱 OneSignal Player ID:', playerId);
              await supabase
                .from('companies')
                .update({ onesignal_player_id: playerId })
                .eq('id', user.id);
            }
          }, 3000); // Wait longer for OneSignal to be ready
        }
      } catch (error) {
        console.error('❌ OneSignal setup failed:', error);
      }
    };

    setupOneSignal();
  }, [user, supabase]);

  useEffect(() => {
    if (user?.id) {
      // Initialize OneSignal
      OneSignalService.initialize(user.id);

      // Save player ID to database
      const savePlayerId = async () => {
        const playerId = await OneSignalService.getPlayerId();
        if (playerId) {
          await supabase
            .from('companies')
            .update({ onesignal_player_id: playerId })
            .eq('id', user.id);
        }
      };

      setTimeout(savePlayerId, 2000); // Wait for initialization
    }
  }, [user]);

  const NotificationSettings = () => {
    const [preferences, setPreferences] = useState({
      push: true,
      email: true,
      browser: true
    });

    const updatePreferences = async (key, value) => {
      const newPrefs = { ...preferences, [key]: value };
      setPreferences(newPrefs);

      await supabase
        .from('companies')
        .update({ notification_preferences: newPrefs })
        .eq('id', user.id);
    };

    return (
      <div className="bg-white rounded-xl p-6 shadow">
        <h3 className="text-lg font-bold mb-4">Notification Settings</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-gray-500">Instant alerts when app is closed</p>
            </div>
            <button
              onClick={() => updatePreferences('push', !preferences.push)}
              className={`w-12 h-6 rounded-full transition ${preferences.push ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transform transition ${preferences.push ? 'translate-x-7' : 'translate-x-1'} mt-0.5`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">Backup alerts to your email</p>
            </div>
            <button
              onClick={() => updatePreferences('email', !preferences.email)}
              className={`w-12 h-6 rounded-full transition ${preferences.email ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transform transition ${preferences.email ? 'translate-x-7' : 'translate-x-1'} mt-0.5`} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  console.log('🖥️ Browser focus state:', {
    isFocused: document.hasFocus(),
    visibilityState: document.visibilityState,
    hidden: document.hidden
  });

  // Some browsers suppress notifications when tab is focused
  if (document.hasFocus()) {
    console.log('⚠️ Browser tab is focused - some browsers suppress notifications');
  } else {
    console.log('✅ Browser tab is not focused - notification should show');
  }

  // Add this function inside your CompanyDashboard component, before the return statement
  const sendJobNotification = async (companyId, jobId, jobDetails) => {
    try {
      // 1. Create database notification (you already do this elsewhere)
      const { error } = await supabase.from('notifications').insert({
        user_id: companyId,
        job_id: jobId, // ADD THIS
        title: '🔧 New Job Assignment',
        message: `New job: ${jobDetails?.category || 'Home Service'} - ${jobDetails?.sub_service || 'General'}`,
        type: 'job_assigned',
        read: false
      });
      if (error) throw error;
      // Request notification permission on login
      useEffect(() => {
        if (user && company && Notification.permission === 'default') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              console.log('✅ Notification permission granted');

              // Register for push notifications
              registerPushNotifications();
            }
          });
        } else if (Notification.permission === 'granted') {
          // Already have permission, register push
          registerPushNotifications();
        }
      }, [user, company]);

      // Function to register for push notifications
      const registerPushNotifications = async () => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          try {
            const registration = await navigator.serviceWorker.ready;

            // Check current subscription
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
              // Subscribe to push notifications
              // NOTE: You need a VAPID key for production
              const response = await fetch('/api/vapid-public-key'); // You need to create this endpoint
              const vapidPublicKey = await response.text();
              const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

              subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
              });

              // Save subscription to your database
              await savePushSubscription(subscription);
            }

            console.log('✅ Push notification subscription:', subscription);
          } catch (error) {
            console.error('❌ Push registration failed:', error);
          }
        }
      };

      // Helper function for VAPID key
      const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
          .replace(/\-/g, '+')
          .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      // Save subscription to database
      const savePushSubscription = async (subscription) => {
        try {
          await supabase.from('push_subscriptions').insert({
            user_id: user.id,
            subscription: JSON.stringify(subscription),
            created_at: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error saving push subscription:', error);
        }
      };
      // 2. Send browser push notification
      if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification('🔧 Mount: New Job!', {
            body: `${newJob.category} - ${newJob.sub_service}`,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: `job-${newJob.id}-${Date.now()}`, // Add timestamp to make it unique
            data: {
              url: `/company/jobs/${newJob.id}`,
              jobId: newJob.id,
              timestamp: Date.now()
            },
            vibrate: [200, 100, 200],
            actions: [
              {
                action: 'view',
                title: 'View Job'
              }
            ],
            requireInteraction: false,
            silent: false,
            // ADD THESE OPTIONS:
            renotify: true, // Allow re-notification with same tag
            timestamp: Date.now(), // Explicit timestamp
            // Add a small delay to ensure service worker is ready
          })
            .then(() => {
              console.log('✅ Browser notification shown successfully for job:', newJob.id);

              // Also log to service worker console
              if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: 'NOTIFICATION_SHOWN',
                  jobId: newJob.id,
                  timestamp: Date.now()
                });
              }
            })
            .catch(err => console.error('❌ Failed to show notification:', err));
        });
      }
      // Send notification immediately
      console.log('🚀 Attempting to send browser notification...');

      // Add small delay to ensure stability
      setTimeout(() => {
        if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready
            .then(registration => {
              console.log('✅ Service Worker ready, showing notification...');

              // ... the showNotification code goes here
            })
            .catch(err => console.error('❌ Service Worker not ready:', err));
        } else {
          console.log('⚠️ Cannot send notification - missing permission or service worker');
        }
      }, 500); // 500ms delay

      self.addEventListener('notificationclick', function (event) {
        console.log('Notification clicked:', event.notification.tag);
        event.notification.close();

        // Handle click action
        if (event.action === 'view') {
          const url = event.notification.data.url;
          event.waitUntil(clients.openWindow(url));
        }
      });

      // Check if we should show notification (based on focus state)
      const shouldShowNotification = !document.hasFocus() || true; // Set to true to always show

      if (shouldShowNotification) {
        registration.showNotification('🔧 Mount: New Job!', {
          body: `${newJob.category} - ${newJob.sub_service}`,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: `job-${newJob.id}-${Date.now()}`,
          data: {
            url: `/company/jobs/${newJob.id}`,
            jobId: newJob.id
          },
          vibrate: [200, 100, 200],
          actions: [
            {
              action: 'view',
              title: 'View Job'
            }
          ],
          requireInteraction: true, // Changed to true - forces notification to stay
          silent: false,
          renotify: true
        })
          .then(() => console.log('✅ Notification shown (tab focused:', document.hasFocus(), ')'))
          .catch(err => console.error('❌ Notification failed:', err));
      } else {
        console.log('⏸️ Notification skipped - tab is focused and browser suppresses');

        // Show an in-app notification instead
        const event = new CustomEvent('show-toast', {
          detail: {
            message: `New job: ${newJob.category} - ${newJob.sub_service}`,
            type: 'success'
          }
        });
        window.dispatchEvent(event);
      }


      // Add toast notification system
      useEffect(() => {
        const handleToast = (e) => {
          // Create toast element
          const toast = document.createElement('div');
          toast.id = 'app-toast';
          toast.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: #10B981; color: white; padding: 16px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.1); animation: slideIn 0.3s ease;">
        <strong>🔔 ${e.detail.type === 'success' ? 'New Job!' : 'Alert'}</strong><br>
        ${e.detail.message}
      </div>
    `;

          // Add styles
          const style = document.createElement('style');
          style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
          document.head.appendChild(style);

          document.body.appendChild(toast);

          // Remove after 5 seconds
          setTimeout(() => {
            if (toast.firstChild) {
              toast.firstChild.style.animation = 'slideOut 0.3s ease';
              setTimeout(() => {
                if (document.body.contains(toast)) {
                  document.body.removeChild(toast);
                }
              }, 300);
            }
          }, 5000);
        };

        window.addEventListener('show-toast', handleToast);

        return () => {
          window.removeEventListener('show-toast', handleToast);
        };
      }, []);


      // 3. Play sound notification
      try {
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Audio play failed:', e));
      } catch (soundError) {
        console.log('Sound notification error:', soundError);
      }

      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  };

  // Load company data with correct rating
  useEffect(() => {
    const loadCompany = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        if (data) {
          setCompany(data)
          // Load stats with correct rating from company data
          loadStats(data.id, data)
        }
      } catch (error) {
        console.error('Error loading company:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) loadCompany()
  }, [user, supabase])

  // Load company statistics
  const loadStats = async (companyId, companyData) => {
    try {
      // Get job counts
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('status, quoted_price')
        .eq('company_id', companyId)

      const pendingJobs = jobsData?.filter(j => j.status === 'pending').length || 0
      const activeJobs = jobsData?.filter(j => ['deposit_paid', 'work_ongoing', 'intermediate_paid'].includes(j.status)).length || 0
      const completedJobs = jobsData?.filter(j => ['completed', 'work_completed'].includes(j.status)).length || 0

      const totalEarnings = jobsData
        ?.filter(j => ['completed', 'work_completed'].includes(j.status))
        ?.reduce((sum, job) => sum + (job.quoted_price || 0), 0) || 0

      // Get rating directly from company data
      const averageRating = companyData?.average_rating || 0
      const totalReviews = companyData?.total_reviews || 0

      setStats({
        pendingJobs,
        activeJobs,
        completedJobs,
        totalEarnings,
        averageRating,
        totalReviews
      })

      setPendingJobCount(pendingJobs)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  // Load notifications on mount
  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user, loadNotifications])

  // Request notification permission on login
  useEffect(() => {
    if (user && company && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('✅ Notification permission granted');
          // Register for push notifications here
        }
      });
    }
  }, [user, company]);

  // REAL-TIME JOB COUNT
  useEffect(() => {
    if (!user) return

    const fetchJobCount = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('id')
          .eq('company_id', user.id)
          .eq('status', 'pending')

        if (error) throw error
        const newCount = data?.length || 0

        if (newCount > previousCountRef.current) {
          setHasNewJobs(true)
          setTimeout(() => setHasNewJobs(false), 10000)
        }

        setPendingJobCount(newCount)
        previousCountRef.current = newCount
      } catch (error) {
        console.warn('Error fetching job count:', error)
      }
    }

    fetchJobCount()

    const channel = supabase
      .channel(`company-jobs-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jobs',
          filter: `company_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 REAL-TIME EVENT TRIGGERED:', {
            event: 'INSERT',
            table: 'jobs',
            payload: payload,
            companyId: user.id,
            timestamp: new Date().toISOString()
          });

          // Log the actual job data
          const newJob = payload.new;
          console.log('📋 NEW JOB DETAILS:', {
            id: newJob.id,
            category: newJob.category,
            sub_service: newJob.sub_service,
            customer_id: newJob.customer_id,
            status: newJob.status
          });

          // Send notification immediately
          console.log('🚀 Attempting to send browser notification...');

          if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready
              .then(registration => {
                console.log('✅ Service Worker ready, showing notification...');

                registration.showNotification('🔧 Mount: New Job!', {
                  body: `${newJob.category} - ${newJob.sub_service}`,
                  icon: '/icons/logo192.png',
                  badge: '/icons/logo192.png',
                  tag: `job-${newJob.id}`,
                  data: {
                    url: `/company/jobs/${newJob.id}`,
                    jobId: newJob.id
                  },
                  vibrate: [200, 100, 200],
                  actions: [
                    {
                      action: 'view',
                      title: 'View Job'
                    }
                  ]
                })
                  .then(() => console.log('✅ Browser notification shown successfully'))
                  .catch(err => console.error('❌ Failed to show notification:', err));
              })
              .catch(err => console.error('❌ Service Worker not ready:', err));
          } else {
            console.log('⚠️ Cannot send notification - missing permission or service worker');
          }

          // Rest of existing code (increment count, refresh stats)
          setPendingJobCount(prev => {
            const newCount = prev + 1
            setHasNewJobs(true)
            setTimeout(() => setHasNewJobs(false), 10000)
            return newCount
          });

          // Refresh company data to update stats
          supabase
            .from('companies')
            .select('*')
            .eq('id', user.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setCompany(data)
                loadStats(user.id, data)
              }
            })
        }
      )
      .subscribe((status) => {
        console.log('📡 Supabase Channel Status:', status);

        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to job changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Channel timeout');
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Channel closed');
        }
      })


    // TEST: Log channel info
    console.log('📡 Channel created:', `company-jobs-${user.id}`);
    console.log('👤 Company ID:', user.id);

    // ADD real-time subscription for notifications to update read status
    const notificationChannel = supabase
      .channel(`company-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Reload notifications to get updated read status
          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(notificationChannel)
    }
  }, [user, supabase, loadNotifications])
  // Check Service Worker Registration
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration()
        .then(reg => {
          if (reg) {
            console.log('✅ Service Worker Registered:', reg);
            console.log('🔗 Service Worker Scope:', reg.scope);

            // Also check if service worker is controlling the page
            if (navigator.serviceWorker.controller) {
              console.log('✅ Service Worker is controlling the page');
            } else {
              console.log('⚠️ Service Worker installed but not controlling');
            }
          } else {
            console.log('❌ No Service Worker registered');
          }
        })
        .catch(err => console.error('❌ Service Worker check error:', err));
    } else {
      console.log('❌ Service Workers not supported');
    }
    // Add notification permission check
    console.log('🔔 Notification Permission:', Notification.permission);

    // Detailed permission state
    if (Notification.permission === 'granted') {
      console.log('✅ Notifications are granted');
    } else if (Notification.permission === 'denied') {
      console.log('❌ Notifications are blocked');
    } else {
      console.log('⚠️ Notifications not requested yet (default state)');
    }
  }, []);



  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Mark all as read in database
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error

      // Refresh notifications
      await loadNotifications()
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-naijaGreen border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.282 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 text-center mb-3">Profile Not Found</h2>
          <p className="text-gray-600 text-center mb-6">
            Unable to load your company profile. Please contact support or try logging in again.
          </p>
          <button
            onClick={signOut}
            className="w-full bg-naijaGreen text-white font-semibold py-3 rounded-xl hover:bg-darkGreen transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    )
  }

  // Calculate unread notifications
  const unreadNotifications = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                <img
                  src={logo}
                  alt="Mount Logo"
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">Mount Portal</h1>
                <p className="text-xs text-gray-500">Company Dashboard</p>
              </div>
            </div>
            {/* Add this button in the header with other buttons */}
            <button
              onClick={() => {
                console.log('🧪 Testing notification...');
                if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
                  navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification('🔧 TEST: Mount Notification', {
                      body: 'This is a test notification from Mount',
                      icon: '/logo.png', // Use your main logo
                      badge: '/logo.png',
                      tag: 'test-' + Date.now(),
                      requireInteraction: false,
                      silent: false,
                      vibrate: [200, 100, 200]
                    })
                      .then(() => console.log('✅ Test notification shown'))
                      .catch(err => console.error('❌ Test notification failed:', err));
                  });
                } else {
                  console.log('❌ Cannot test - permissions or service worker missing');
                }
              }}
              className="p-2 text-gray-600 hover:text-naijaGreen transition-colors"
              title="Test Notification"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Jobs Button - ONLY shows pending jobs */}
              <div className="relative">
                <button
                  onClick={() => setActivePanel(activePanel === 'jobs' ? 'dashboard' : 'jobs')}
                  className="relative p-2 text-gray-600 hover:text-naijaGreen transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>

                  {/* ONLY show PENDING JOBS count here */}
                  {pendingJobCount > 0 && (
                    <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full text-xs font-semibold text-white ${hasNewJobs ? 'animate-pulse bg-red-500' : 'bg-naijaGreen'
                      }`}>
                      {pendingJobCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Notifications Button - ONLY shows unread notifications */}
              <div className="relative">
                <button
                  onClick={() => setActivePanel(activePanel === 'notifications' ? 'dashboard' : 'notifications')}
                  className="relative p-2 text-gray-600 hover:text-naijaGreen transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>

                  {/* ONLY show UNREAD NOTIFICATIONS count here */}
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full text-xs font-semibold text-white bg-blue-500">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              </div>

              {/* Company Name with Profile Picture */}
              <div className="hidden md:flex items-center space-x-3">
                {/* Profile Picture */}
                {company.picture_url ? (
                  <img
                    src={company.picture_url}
                    alt={company.company_name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.company_name)}&background=10B981&color=fff&bold=true`
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-r from-naijaGreen to-darkGreen rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {company.company_name?.charAt(0) || 'C'}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">{company.company_name}</p>
                  {stats.averageRating > 0 && (
                    <div className="flex items-center">
                      <svg className="w-3 h-3 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs text-gray-500">{stats.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-2 focus:outline-none">
                  {company.picture_url ? (
                    <img
                      src={company.picture_url}
                      alt={company.company_name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.company_name)}&background=10B981&color=fff&bold=true`
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-r from-naijaGreen to-darkGreen rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {company.company_name?.charAt(0) || 'C'}
                      </span>
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <button
                    onClick={() => setEditing(true)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Edit Profile
                  </button>
                  <a
                    href={`/company/${company.id}/reviews`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    View Reviews
                    {stats.totalReviews > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-amber-500 text-white">
                        {stats.totalReviews}
                      </span>
                    )}
                  </a>
                  <button
                    onClick={signOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 border-b border-gray-200">
            <button
              onClick={() => setActivePanel('dashboard')}
              className={`px-4 py-3 font-medium text-sm transition-colors relative ${activePanel === 'dashboard'
                ? 'text-naijaGreen border-b-2 border-naijaGreen'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActivePanel('jobs')}
              className={`px-4 py-3 font-medium text-sm transition-colors relative ${activePanel === 'jobs'
                ? 'text-naijaGreen border-b-2 border-naijaGreen'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Jobs
              {pendingJobCount > 0 && (
                <span className={`ml-2 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full ${hasNewJobs ? 'bg-red-500 animate-pulse' : 'bg-naijaGreen'
                  } text-white`}>
                  {pendingJobCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActivePanel('notifications')}
              className={`px-4 py-3 font-medium text-sm transition-colors relative ${activePanel === 'notifications'
                ? 'text-naijaGreen border-b-2 border-naijaGreen'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Notifications
              {unreadNotifications > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-blue-500 text-white">
                  {unreadNotifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {editing ? (
          <ProfileSection
            company={company}
            editing={editing}
            setEditing={setEditing}
          />
        ) : (
          <>
            {/* Dashboard Overview */}
            {activePanel === 'dashboard' && (
              <div className="space-y-8">
                {/* Welcome Card with Profile Picture */}
                <div className="bg-gradient-to-r from-naijaGreen to-darkGreen rounded-2xl p-8 text-white shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-center">
                      {/* Profile Picture - LARGE and VISIBLE */}
                      {company.picture_url ? (
                        <img
                          src={company.picture_url}
                          alt={company.company_name}
                          className="w-24 h-24 rounded-full object-cover border-4 border-white/30 shadow-lg mr-6"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.company_name)}&background=fff&color=10B981&bold=true&size=96`
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30 mr-6">
                          <span className="text-3xl font-bold">
                            {company.company_name?.charAt(0) || 'C'}
                          </span>
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl font-bold mb-2">{company.company_name}</h2>
                        <p className="opacity-90">Manage your services, track jobs, and grow your business.</p>
                      </div>
                    </div>
                    <div className="mt-6 md:mt-0">
                      <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-white/30 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">⭐</span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm opacity-80">Average Rating</p>
                            <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5.0</p>
                            <div className="flex items-center mt-2">
                              <a
                                href={`/company/${company.id}/reviews`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm bg-white text-naijaGreen px-3 py-1 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                View all Reviews ({stats.totalReviews})
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Pending Jobs</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.pendingJobs}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Active Jobs</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.activeJobs}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Completed</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.completedJobs}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Total Earnings</p>
                        <p className="text-2xl font-bold text-gray-800">₦{stats.totalEarnings.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActivePanel('jobs')}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-naijaGreen hover:bg-green-50 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-800">View Jobs</p>
                        <p className="text-sm text-gray-500">Manage incoming work</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-800">Edit Profile</p>
                        <p className="text-sm text-gray-500">Update company details</p>
                      </div>
                    </button>

                    <a
                      href={`/company/${company.id}/reviews`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-800">Manage Reviews</p>
                        <p className="text-sm text-gray-500">Reply to customer reviews</p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Jobs Panel */}
            {activePanel === 'jobs' && (
              <JobsSection
                showJobs={true}
                setShowJobs={(show) => !show && setActivePanel('dashboard')}
                user={user}
                supabase={supabase}
              />
            )}

            {/* Notifications Panel */}
            {activePanel === 'notifications' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>
                      <p className="text-sm text-gray-500">Latest updates about your jobs</p>
                    </div>
                    {unreadNotifications > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-naijaGreen hover:text-darkGreen font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No notifications yet</h3>
                    <p className="text-gray-500">You'll see updates here when you get new jobs or messages.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-start">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notification.type && notification.type.includes('payment') ? 'bg-green-100 text-green-600' :
                            notification.type && notification.type.includes('job') ? 'bg-blue-100 text-blue-600' :
                              notification.type && notification.type.includes('review') ? 'bg-amber-100 text-amber-600' :
                                'bg-gray-100 text-gray-600'
                            }`}>
                            {notification.type && notification.type.includes('payment') ? '💰' :
                              notification.type && notification.type.includes('job') ? '📋' :
                                notification.type && notification.type.includes('review') ? '⭐' : '📢'}
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-gray-900">{notification.title}</h4>
                              <span className="text-xs text-gray-500">
                                {new Date(notification.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-600 mt-1">{notification.message}</p>
                            {!notification.read && (
                              <span className="inline-block mt-2 text-xs font-medium text-blue-600">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}