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
  const { user } = useAuth(); // We might need user ID to identify in RC
  const [isPro, setIsPro] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);

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
        checkEntitlements(info);

        loadOfferings();
      } catch (e) {
        console.error("RevenueCat init error", e);
      }
    };
    init();
  }, [user]);

  const checkEntitlements = (info: CustomerInfo) => {
    if (info.entitlements.active['pro_access']) { // Replace 'pro_access' with your actual entitlement ID
      setIsPro(true);
    } else {
      setIsPro(false);
    }
  };

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
      checkEntitlements(customerInfo);
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
      checkEntitlements(info);
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
