import React from 'react';
import {Redirect,useLocalSearchParams} from 'expo-router';
import {isTriviaDate} from '@/lib/discoveryDates';
export default function SharedTrivia(){
 const {date}=useLocalSearchParams<{date?:string}>();
 return <Redirect href={{pathname:'/discoveries',params:{source:'shared_link',...(isTriviaDate(date)?{date}:{})}}}/>;
}
