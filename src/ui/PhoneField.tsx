import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { countries, CountryOption } from '../api/countries';
import { messageOf } from '../api/client';
import { colors } from '../theme/colors';
import { Button, s, State } from './Kit';
import { Icon } from './Icon';

export function PhoneField({ label, countryCode, onCountryChange, number, onNumberChange, optional = false }: { label: string; countryCode: string; onCountryChange: (countryCode: string) => void; number: string; onNumberChange: (number: string) => void; optional?: boolean }) {
  const [list, setList] = useState<CountryOption[]>([]), [open, setOpen] = useState(false), [search, setSearch] = useState(''), [error, setError] = useState('');
  useEffect(() => { let mounted = true; countries().then((data) => { if (mounted) setList(data); }).catch((e) => { if (mounted) setError(messageOf(e)); }); return () => { mounted = false; }; }, []);
  const selected = list.find((item) => item.countryCode === countryCode);
  const filtered = useMemo(() => list.filter((item) => `${item.name} ${item.dialCode} ${item.countryCode}`.toLowerCase().includes(search.toLowerCase())), [list, search]);
  const display = number.startsWith('+') && selected && number.startsWith(selected.dialCode) ? number.slice(selected.dialCode.length) : number;
  return <View style={{ gap: 7 }}><Text style={s.label}>{label}{optional ? ' (optional)' : ''}</Text><View style={{ flexDirection:'row',gap:8 }}>
    <Pressable accessibilityRole="button" accessibilityLabel="Select country calling code" onPress={() => setOpen(true)} style={[s.input,{ minWidth:108,justifyContent:'center',flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:9 }]}><Text style={{color:selected?colors.ink:colors.muted,fontWeight:'600'}}>{selected ? `${selected.countryCode} ${selected.dialCode}` : 'Code'}</Text><Icon name="chevron" size={14} color={colors.muted}/></Pressable>
    <TextInput value={display} onChangeText={(value) => onNumberChange(value.replace(/[^0-9\s()-]/g, ''))} editable={!!selected} keyboardType="phone-pad" autoComplete="tel-national" placeholder={selected ? 'Mobile number' : 'Select code first'} placeholderTextColor="#91A29A" style={[s.input,{flex:1,minWidth:0,opacity:selected?1:.6}]}/>
  </View>{!!selected && <Text style={{color:colors.muted,fontSize:12}}>{selected.name}</Text>}{!!error && <Text style={{color:colors.danger,fontSize:12}}>{error}</Text>}
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}><View style={{flex:1,backgroundColor:colors.background,paddingHorizontal:20,paddingTop:24,gap:12}}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={{fontSize:22,fontWeight:'700',color:colors.ink}}>Select country code</Text><Button label="Close" variant="text" onPress={()=>setOpen(false)}/></View><TextInput value={search} onChangeText={setSearch} placeholder="Search country or code" placeholderTextColor={colors.muted} style={s.input}/>{error ? <State error={error} retry={async()=>{try{setList(await countries());setError('');}catch(e){setError(messageOf(e));}}}/> : <FlatList keyboardShouldPersistTaps="handled" data={filtered} keyExtractor={(item)=>item.countryCode} renderItem={({item})=><Pressable onPress={()=>{onCountryChange(item.countryCode);onNumberChange('');setOpen(false);setSearch('');}} style={{minHeight:52,borderBottomWidth:1,borderColor:colors.border,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{fontSize:15,color:colors.ink,flex:1}}>{item.name}</Text><Text style={{fontSize:14,color:colors.muted}}>{item.dialCode}</Text></Pressable>}/>}</View></Modal>
  </View>;
}
