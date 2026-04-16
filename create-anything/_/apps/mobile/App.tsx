import { usePathname, useRouter } from 'expo-router';
import { App } from 'expo-router/build/qualified-entry';
import React, { memo, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { ErrorBoundaryWrapper } from './__create/SharedErrorBoundary';
import './src/__create/polyfills';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';
import { AlertModal } from './polyfills/web/alerts.web';
import './global.css';

const GlobalErrorReporter = () => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const errorHandler = (event: ErrorEvent) => {
      if (typeof event.preventDefault === 'function') event.preventDefault();
      console.error(event.error);
    };
    // unhandled promises happen all the time, so we just log them
    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      if (typeof event.preventDefault === 'function') event.preventDefault();
      console.error('Unhandled promise rejection:', event.reason);
    };
    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
    };
  }, []);
  return null;
};

const Wrapper = memo(() => {
  // Safe defaults for native platforms
  const getInitialMetrics = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return {
        insets: { top: 64, bottom: 34, left: 0, right: 0 },
        frame: {
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        },
      };
    }
    // Default safe metrics for iOS/Android
    return {
      insets: { top: 64, bottom: 34, left: 0, right: 0 },
      frame: {
        x: 0,
        y: 0,
        width: 390,
        height: 844,
      },
    };
  };

  return (
    <ErrorBoundaryWrapper>
      <SafeAreaProvider initialMetrics={getInitialMetrics()}>
        <App />
        {Platform.OS === 'web' && <GlobalErrorReporter />}
        <Toaster />
      </SafeAreaProvider>
    </ErrorBoundaryWrapper>
  );
});
const healthyResponse = {
  type: 'sandbox:mobile:healthcheck:response',
  healthy: true,
};

const useHandshakeParent = () => {
  useEffect(() => {
    // Only execute on web platform
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.parent) {
      return;
    }
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'sandbox:mobile:healthcheck') {
        window.parent.postMessage(healthyResponse, '*');
      }
    };
    window.addEventListener('message', handleMessage);
    // Immediately respond to the parent window with a healthy response in
    // case we missed the healthcheck message
    window.parent.postMessage(healthyResponse, '*');
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
};

const CreateApp = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isWeb = Platform.OS === 'web';
  
  // Hook must be called unconditionally, but it guards internally
  useHandshakeParent();

  useEffect(() => {
    // Only execute on web platform
    if (!isWeb || typeof window === 'undefined' || !window.parent) {
      return;
    }
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'sandbox:navigation' && event.data.pathname !== pathname) {
        router.push(event.data.pathname);
      }
    };

    window.addEventListener('message', handleMessage);
    window.parent.postMessage({ type: 'sandbox:mobile:ready' }, '*');
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [router, pathname, isWeb]);

  useEffect(() => {
    // Only execute on web platform
    if (!isWeb || typeof window === 'undefined' || !window.parent) {
      return;
    }
    window.parent.postMessage(
      {
        type: 'sandbox:mobile:navigation',
        pathname,
      },
      '*'
    );
  }, [pathname, isWeb]);

  return (
    <>
      <Wrapper />
      {isWeb && <AlertModal />}
    </>
  );
};

export default CreateApp;
