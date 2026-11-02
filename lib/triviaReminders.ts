import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { discoverySessionId } from './discoveries';
import { fetchUserProfile, updateUserProfile } from './api';
import { registerForPushNotificationsAsync, savePushTokenToProfile } from './pushNotifications';
export const triviaReminderChoiceKey=(account:string)=>`trivia-evening-choice:v1:${account}`;
export class TriviaReminderError extends Error {
 constructor(message:string,public code:'denied'|'unavailable'|'account'|'save'){super(message);}
}
async function sameAccount(account:string){if(await discoverySessionId()!==account)throw new TriviaReminderError('Your account changed. Please try again.','account');}
export async function requestTriviaReminderAccess(account:string){
 await sameAccount(account);
 const initial=await Notifications.getPermissionsAsync();
 const permission=initial.status==='granted' ? initial:initial.canAskAgain===false ? initial:await Notifications.requestPermissionsAsync();
 await sameAccount(account);
 if(permission.status!=='granted')throw new TriviaReminderError('Notifications are off for Sanctuary. You can enable them in your device settings.','denied');
 if(!Device.isDevice)throw new TriviaReminderError('Evening reminders need Sanctuary installed on a supported phone.','unavailable');
 const token=await registerForPushNotificationsAsync();
 await sameAccount(account);
 if(!token)throw new TriviaReminderError('Your phone could not register for reminders. Please try again.','unavailable');
 await savePushTokenToProfile(account,token,true);
}
export async function enableTriviaEveningReminder(account:string){
 await requestTriviaReminderAccess(account);
 const profile=await fetchUserProfile(account);
 await sameAccount(account);
 if(!profile||profile.user_id!==account)throw new TriviaReminderError('Your notification preferences could not load. Please try again.','save');
 const preferences=profile.user_preferences||{};
 await updateUserProfile(account,{user_preferences:{...preferences,notifications:{...preferences.notifications,trivia:true}}},true);
 await sameAccount(account);
 await AsyncStorage.setItem(triviaReminderChoiceKey(account),'enabled');
}
