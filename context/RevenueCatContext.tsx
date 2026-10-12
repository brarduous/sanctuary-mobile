import API_KEYS from '@/constants/RevenueCat';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { useAuth } from './AuthContext';

let configuredRevenueCatKey: string | null = null;
// Identity mutations must finish in order, even when accounts change mid-request.
let identityQueue: Promise<unknown> = Promise.resolve();

interface RevenueCatContextType {
  isPro: boolean;
  packages: PurchasesPackage[];
  customerInfo: CustomerInfo | null;
  isLoaded: boolean;
  purchasePackage: (pack: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  loadOfferings: () => Promise<void>;
}
const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

export const RevenueCatProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile, refreshProfile } = useAuth();
  const accountId: string | null = user?.id ?? null;
  const currentAccount = useRef(accountId);
  currentAccount.current = accountId;
  const refresh = useRef(refreshProfile);
  refresh.current = refreshProfile;
  const readyAccount = useRef<string | null | undefined>(undefined);
  const [state, setState] = useState<{ owner: string | null; info: CustomerInfo | null; packages: PurchasesPackage[]; loaded: boolean }>({ owner: accountId, info: null, packages: [], loaded: false });
  const offeringRequest = useRef(0);
  const actionInFlight = useRef(false);

  const loadOfferings = useCallback(async () => {
    const owner = currentAccount.current;
    const request = ++offeringRequest.current;
    if (!configuredRevenueCatKey || readyAccount.current !== owner) return;
    setState(previous => ({ ...previous, loaded: false }));
    try {
      const offerings = await Purchases.getOfferings();
      if (request === offeringRequest.current && currentAccount.current === owner) {
        setState(previous => ({ ...previous, packages: offerings.current?.availablePackages ?? [], loaded: true }));
      }
    } catch {
      if (request === offeringRequest.current && currentAccount.current === owner) {
        setState(previous => ({ ...previous, packages: [], loaded: true }));
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    readyAccount.current = undefined;
    offeringRequest.current += 1;
    setState({ owner: accountId, info: null, packages: [], loaded: false });
    const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google;
    const init = async () => {
      if (!active) return;
      if (!apiKey) {
        setState({ owner: accountId, info: null, packages: [], loaded: true });
        return;
      }
      try {
        if (configuredRevenueCatKey !== apiKey) {
          Purchases.configure({ apiKey });
          configuredRevenueCatKey = apiKey;
        }
        if (accountId) await Purchases.logIn(accountId);
        else if (!(await Purchases.isAnonymous())) await Purchases.logOut();
        const info = await Purchases.getCustomerInfo();
        if (!active || currentAccount.current !== accountId) return;
        readyAccount.current = accountId;
        setState({ owner: accountId, info, packages: [], loaded: false });
        await loadOfferings();
      } catch {
        if (active && currentAccount.current === accountId) {
          setState({ owner: accountId, info: null, packages: [], loaded: true });
        }
      }
    };
    identityQueue = identityQueue.catch(() => {}).then(init);
    return () => { active = false; };
  }, [accountId, loadOfferings]);

  useEffect(() => {
    let active = true;
    const listener = (info: CustomerInfo) => {
      // Events during logIn/logOut belong to the identity transition, not the UI.
      if (!active || readyAccount.current !== accountId || currentAccount.current !== accountId) return;
      setState(previous => ({ ...previous, owner: accountId, info }));
      void refresh.current();
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => { active = false; Purchases.removeCustomerInfoUpdateListener(listener); };
  }, [accountId]);

  const perform = async (operation: () => Promise<CustomerInfo>) => {
    const owner = currentAccount.current;
    if (!owner || !configuredRevenueCatKey || readyAccount.current !== owner || actionInFlight.current) {
      throw new Error('Subscriptions unavailable');
    }
    actionInFlight.current = true;
    const action = identityQueue.catch(() => {}).then(async () => {
      if (currentAccount.current !== owner || readyAccount.current !== owner) throw new Error('Account changed');
      const info = await operation();
      if (currentAccount.current === owner && readyAccount.current === owner) {
        setState(previous => ({ ...previous, owner, info }));
        await refresh.current();
      }
    });
    identityQueue = action;
    try { await action; }
    finally { actionInFlight.current = false; }
  };
  const purchasePackage = async (pack: PurchasesPackage) => {
    try { await perform(async () => (await Purchases.purchasePackage(pack)).customerInfo); }
    catch (error: any) { if (!error?.userCancelled) throw error; }
  };
  const restorePurchases = () => perform(() => Purchases.restorePurchases());

  // Mask the previous account immediately, before the identity effect runs.
  const customerInfo = state.owner === accountId ? state.info : null;
  const profileMatches = !!accountId && profile?.user_id === accountId;
  const isProfilePro = profileMatches && (profile.subscription_tier === 'pro' || profile.subscription_tier === 'admin' || profile.is_whitelisted === true);
  const isPro = !!accountId && (!!customerInfo?.entitlements.active['subscriber'] || isProfilePro);
  return <RevenueCatContext.Provider value={{ isPro, packages: state.owner === accountId ? state.packages : [], customerInfo, isLoaded: state.owner === accountId && state.loaded, purchasePackage, restorePurchases, loadOfferings }}>{children}</RevenueCatContext.Provider>;
};

export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);
  if (!context) throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  return context;
};
