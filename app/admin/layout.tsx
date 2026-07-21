'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, menuItems } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { withAuth } from './hoc/withAuth';

function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading]     = useState(true);

  // ✅ Login page ke liye sirf children return karo
  // Sidebar/Navbar wrap mat karo
  const isLoginPage = pathname === '/admin/login';

  const getActiveTab = () => {
    const path = pathname.replace('/admin', '').split('?')[0];
    if (!path || path === '/') return 'dashboard';
    const segments    = path.split('/').filter(Boolean);
    const firstSegment = segments[0];
    const matchingItem = menuItems.find(item => item.id === firstSegment);
    return matchingItem ? firstSegment : 'dashboard';
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/v1/auth/admin/logout', {
        method     : 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        router.replace('/admin/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleTabChange = (tab: string) => {
    const menuItem = menuItems.find(item => item.id === tab);
    if (menuItem) {
      if (tab === 'dashboard') {
        router.push('/admin');
      } else {
        router.push(`/admin/${tab}`);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // ✅ Login page — sirf children, koi wrap nahi
  if (isLoginPage) {
    return (
      <>
        <Toaster position="top-right" />
        {children}
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-neutral-200 border-t-blue-500 rounded-full mx-auto mb-4"
          />
          <p className="text-neutral-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const activeTab = getActiveTab();

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background   : '#363636',
            color        : '#fff',
            borderRadius : '12px',
          },
          success: {
            duration  : 3000,
            iconTheme : { primary: '#22c55e', secondary: '#fff' },
          },
          error: {
            duration  : 4000,
            iconTheme : { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 flex flex-col">
        <div className="flex flex-1">
          <Sidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onLogout={handleLogout}
          />

          <main className="flex-1 overflow-x-hidden flex flex-col">
            <Navbar
              activeTab={activeTab}
              onMenuClick={() => setSidebarOpen(true)}
              onLogout={handleLogout}
            />

            <motion.div
              className="flex-1 p-4 md:p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-sm border border-neutral-200/50 min-h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            <Footer showSocial={true} showVersion={true} />
          </main>
        </div>
      </div>
    </>
  );
}

export default withAuth(AdminLayout as React.ComponentType);