import { router } from 'expo-router';
import { Alert } from 'react-native';
import { useAuth } from '../../store/auth';
import { Card, Row, Screen, Section } from '../../ui/Kit';
export default function More() {
  const { me, can, signOut } = useAuth();
  return <Screen title="More" subtitle={me?.restaurant.name}><Section title="Manage"/><Card>
    {can('MANAGE_MENU') && <Row title="Menu & categories" icon="menu" onPress={() => router.push('/manage/menu')}/>}
    {can('VIEW_EMPLOYEES') && <Row title="Team" icon="staff" onPress={() => router.push('/manage/employees')}/>}
    {can('VIEW_TABLES') && <Row title="Reservations" icon="calendar" onPress={() => router.push('/manage/reservations')}/>}
    {can('PRINT_RECEIPT') && <Row title="Receipts" icon="receipt" onPress={() => router.push('/manage/receipts')}/>}
    {can('VIEW_REPORTS') && <Row title="Reports" icon="chart" onPress={() => router.push('/manage/reports')}/>}
    {can('MANAGE_SETTINGS') && <Row title="Settings" icon="settings" onPress={() => router.push('/manage/settings')}/>}
    <Row title="Profile" icon="user" onPress={() => router.push('/manage/profile')}/>
  </Card><Section title="Account"/><Card><Row title="Sign out" icon="logout" onPress={() => Alert.alert('Sign out?', 'You will need to sign in again.', [{ text:'Cancel',style:'cancel' }, { text:'Sign out',style:'destructive',onPress:()=>{ void signOut(); } }])}/></Card></Screen>;
}
