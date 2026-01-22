import API_KEYS from '@/constants/RevenueCat';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { useAuth } from './AuthContext';

interface RevenueCatContextType {
  isPro: boolean;
  packages: PurchasesPackage[];
  customerInfo: CustomerInfo | null;
  purchasePackage: (pack: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

export const RevenueCatProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth(); // We might need user ID to identify in RC
  const [isPro, setIsPro] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);

  useEffect(() => {
    // Check if user is Pro based on RevenueCat OR Profile (Database)
    const isRevenueCatPro = customerInfo?.entitlements.active['pro_access'] !== undefined;
    const isProfilePro = profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'admin';
    
    setIsPro(isRevenueCatPro || isProfilePro);
  }, [customerInfo, profile]);

  useEffect(() => {
    const init = async () => {
      try {
        if (Platform.OS === 'ios') {
          Purchases.configure({ apiKey: API_KEYS.apple });
        } else if (Platform.OS === 'android') {
          Purchases.configure({ apiKey: API_KEYS.google });
        }

        if (user?.id) {
            await Purchases.logIn(user.id);
        }

        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);
        // checkEntitlements is now handled by the useEffect above

        loadOfferings();
      } catch (e) {
        console.error("RevenueCat init error", e);
      }
    };
    init();
  }, [user]);

  // Helper to re-evaluate locally if needed (conceptually, but state drives it now)
  // const checkEntitlements = (info: CustomerInfo) => {
  // };

  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current && offerings.current.availablePackages.length !== 0) {
        setPackages(offerings.current.availablePackages);
      }
    } catch (e) {
      console.error("Error fetching offerings", e);
    }
  };

  const purchasePackage = async (pack: PurchasesPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pack);
      setCustomerInfo(customerInfo);
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error("Purchase error", e);
        // Alert.alert("Error", e.message);
      }
    }
  };

  const restorePurchases = async () => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
    } catch (e) {
        console.error("Restore error", e);
    }
  };

  return (
    <RevenueCatContext.Provider value={{ isPro, packages, customerInfo, purchasePackage, restorePurchases }}>
      {children}
    </RevenueCatContext.Provider>
  );
};

export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
};
