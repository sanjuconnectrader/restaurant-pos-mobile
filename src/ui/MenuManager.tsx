import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Category, MenuItem, pos } from '../api/pos';
import { messageOf } from '../api/client';
import { useLive } from '../hooks/useLive';
import { useAuth } from '../store/auth';
import { colors } from '../theme/colors';
import { Button, Card, Field, Row, Section, State, money } from './Kit';
import { Icon } from './Icon';

const gap = 8;

export function MenuManager() {
  const { width } = useWindowDimensions();
  const tileSize = (Math.min(width, 720) - 40 - gap * 2) / 3;
  const currency = useAuth((state) => state.me?.restaurant.currencyCode);
  const { data: categories, loading: categoriesLoading, error: categoriesError, refresh: refreshCategories } = useLive(useCallback(() => pos.categories(), []), [] as Category[]);
  const { data: items, loading: itemsLoading, error: itemsError, refresh: refreshItems } = useLive(useCallback(() => pos.menu(), []), [] as MenuItem[]);

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [tax, setTax] = useState('0');
  const [station, setStation] = useState('');
  const [busy, setBusy] = useState(false);

  const query = search.trim().toLocaleLowerCase();
  const selected = categories.find((category) => category.id === selectedId);
  const matchingItems = useMemo(() => query ? items.filter((item) => {
    const categoryName = categories.find((category) => category.id === item.categoryId)?.name || '';
    return `${item.name} ${item.description || ''} ${categoryName}`.toLocaleLowerCase().includes(query);
  }) : [], [categories, items, query]);
  const visibleCategories = useMemo(() => categories.filter((category) => !query || category.name.toLocaleLowerCase().includes(query) || matchingItems.some((item) => item.categoryId === category.id)), [categories, matchingItems, query]);
  const categoryItems = items.filter((item) => item.categoryId === selectedId);

  function openCategory(category: Category) {
    setSelectedId(category.id);
    setSearch('');
    setItemFormOpen(false);
    setEditingItemId(null);
    setCategoryFormOpen(false);
  }

  function closeCategoryForm() {
    setCategoryFormOpen(false);
    setEditingCategoryId(null);
    setCategoryName('');
  }

  async function saveCategory() {
    const name = categoryName.trim();
    if (!name) return;
    setBusy(true);
    try {
      if (editingCategoryId) {
        await pos.editCategory(editingCategoryId, { name });
      } else {
        const created = await pos.addCategory({ name });
        setSelectedId(created.id);
      }
      closeCategoryForm();
      await refreshCategories();
    } catch (error) {
      Alert.alert('Could not save category', messageOf(error));
    } finally {
      setBusy(false);
    }
  }

  function closeItemForm() {
    setItemFormOpen(false);
    setEditingItemId(null);
    setItemName('');
    setPrice('');
    setDescription('');
    setTax('0');
    setStation('');
  }

  function editItem(item: MenuItem) {
    setEditingItemId(item.id);
    setItemName(item.name);
    setPrice(item.price);
    setDescription(item.description || '');
    setTax(String(item.taxBasisPoints / 100));
    setStation(item.kitchenStation || '');
    setItemFormOpen(true);
  }

  async function saveItem() {
    if (!selectedId) return;
    const amount = Number(price);
    const taxPercent = Number(tax);
    if (!itemName.trim() || !Number.isFinite(amount) || amount < 0 || !Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) return;
    setBusy(true);
    try {
      const values = {
        categoryId: selectedId,
        name: itemName.trim(),
        price: amount.toFixed(2),
        description: description.trim(),
        taxBasisPoints: Math.round(taxPercent * 100),
        kitchenStation: station.trim(),
      };
      if (editingItemId) await pos.editMenu(editingItemId, values);
      else await pos.addMenu({ ...values, available: true, active: true });
      closeItemForm();
      await refreshItems();
    } catch (error) {
      Alert.alert('Could not save menu item', messageOf(error));
    } finally {
      setBusy(false);
    }
  }

  async function updateCategory(active: boolean) {
    if (!selected) return;
    try {
      await pos.editCategory(selected.id, { active });
      await refreshCategories();
    } catch (error) {
      Alert.alert('Could not update category', messageOf(error));
    }
  }

  async function updateItem(item: MenuItem, changes: object) {
    try {
      await pos.editMenu(item.id, changes);
      await refreshItems();
    } catch (error) {
      Alert.alert('Could not update menu item', messageOf(error));
    }
  }

  return <>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, minHeight: 52 }}>
      <Icon name="search" size={20} color={colors.muted}/>
      <TextInput
        accessibilityLabel="Search categories and menu items"
        value={search}
        onChangeText={setSearch}
        placeholder="Search categories or menu items"
        placeholderTextColor={colors.muted}
        autoCorrect={false}
        style={{ flex: 1, color: colors.ink, fontSize: 15, paddingVertical: 10 }}
      />
      {!!search && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch('')} hitSlop={10}><Text style={{ color: colors.accent, fontWeight: '700' }}>Clear</Text></Pressable>}
    </View>

    {(!selected || !!query) && <>
      <Section title="Categories" action={<Text style={{ color: colors.muted, fontSize: 13 }}>{categories.length} total</Text>}/>
      <Button label={categoryFormOpen && !editingCategoryId ? 'Cancel' : 'Add category'} icon={categoryFormOpen && !editingCategoryId ? undefined : 'plus'} variant="secondary" onPress={() => {
        if (categoryFormOpen && !editingCategoryId) closeCategoryForm();
        else { setEditingCategoryId(null); setCategoryName(''); setCategoryFormOpen(true); }
      }}/>
    </>}

    {categoryFormOpen && <Card>
      <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '700' }}>{editingCategoryId ? 'Edit category' : 'New category'}</Text>
      <Field label="Category name" value={categoryName} onChangeText={setCategoryName} placeholder="e.g. Starters" autoFocus maxLength={255}/>
      <Button label={editingCategoryId ? 'Save category' : 'Create category'} onPress={saveCategory} disabled={!categoryName.trim()} loading={busy}/>
      {editingCategoryId && <Button label="Cancel edit" variant="text" onPress={closeCategoryForm}/>}
    </Card>}

    {(!selected || !!query) && (categoriesLoading || categoriesError ? <State loading={categoriesLoading} error={categoriesError} retry={refreshCategories}/> : visibleCategories.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {visibleCategories.map((category) => {
        const count = items.filter((item) => item.categoryId === category.id).length;
        const active = selectedId === category.id && !query;
        return <Pressable
          key={category.id}
          accessibilityRole="button"
          accessibilityLabel={`Open ${category.name} category, ${count} items`}
          onPress={() => openCategory(category)}
          style={{ width: tileSize, height: tileSize, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accentSoft : colors.surface, justifyContent: 'space-between' }}>
          <Icon name="grid" size={20} color={active ? colors.accent : colors.muted}/>
          <View>
            <Text numberOfLines={2} style={{ color: colors.ink, fontSize: 13, lineHeight: 16, fontWeight: '700' }}>{category.name}</Text>
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>{count} {count === 1 ? 'item' : 'items'}{category.active ? '' : ' · Off'}</Text>
          </View>
        </Pressable>;
      })}
    </View> : <State empty={query ? 'No categories match your search.' : 'No categories yet. Add your first category above.'}/>)}

    {!!query && <>
      <Section title="Menu results" action={<Text style={{ color: colors.muted, fontSize: 13 }}>{matchingItems.length} found</Text>}/>
      {itemsLoading || itemsError ? <State loading={itemsLoading} error={itemsError} retry={refreshItems}/> : matchingItems.length ? matchingItems.map((item) => <Card key={item.id}>
        <Row title={item.name} detail={`${categories.find((category) => category.id === item.categoryId)?.name || 'Category'} · ${money(item.price, currency)}`} onPress={() => {
          const category = categories.find((entry) => entry.id === item.categoryId);
          if (category) openCategory(category);
        }}/>
      </Card>) : <State empty="No menu items match your search."/>}
    </>}

    {!query && selected && <>
      <Button label="All categories" icon="back" variant="secondary" onPress={() => { setSelectedId(null); closeItemForm(); closeCategoryForm(); }}/>
      <Card style={{ backgroundColor: colors.accentSoft, borderColor: '#C5E2D7' }}>
        <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>Selected category</Text>
        <Text style={{ color: colors.ink, fontSize: 22, fontWeight: '700' }}>{selected.name}</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{categoryItems.length} menu {categoryItems.length === 1 ? 'item' : 'items'} · {selected.active ? 'Active' : 'Inactive'}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Button label="Edit" variant="secondary" onPress={() => { setCategoryName(selected.name); setEditingCategoryId(selected.id); setCategoryFormOpen(true); }}/></View>
          <View style={{ flex: 1 }}><Button label={selected.active ? 'Deactivate' : 'Activate'} variant="secondary" onPress={() => updateCategory(!selected.active)}/></View>
        </View>
      </Card>

      <Section title="Menu items" action={<Text style={{ color: colors.muted, fontSize: 13 }}>{categoryItems.length} total</Text>}/>
      <Button label={itemFormOpen && !editingItemId ? 'Cancel' : 'Add menu item'} icon={itemFormOpen && !editingItemId ? undefined : 'plus'} disabled={!selected.active} onPress={() => {
        if (itemFormOpen && !editingItemId) closeItemForm();
        else { closeItemForm(); setItemFormOpen(true); }
      }}/>

      {itemFormOpen && <Card>
        <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '700' }}>{editingItemId ? 'Edit menu item' : `Add to ${selected.name}`}</Text>
        <Field label="Name" value={itemName} onChangeText={setItemName}/>
        <Field label="Description (optional)" value={description} onChangeText={setDescription}/>
        <Field label="Price" value={price} onChangeText={setPrice} keyboardType="decimal-pad"/>
        <Field label="Tax percent" value={tax} onChangeText={setTax} keyboardType="decimal-pad"/>
        <Field label="Kitchen station (optional)" value={station} onChangeText={setStation}/>
        <Button label={editingItemId ? 'Save changes' : 'Create menu item'} loading={busy} disabled={!itemName.trim() || !price.trim() || !Number.isFinite(Number(price)) || Number(price) < 0 || !Number.isFinite(Number(tax)) || Number(tax) < 0 || Number(tax) > 100} onPress={saveItem}/>
        {editingItemId && <Button label="Cancel edit" variant="text" onPress={closeItemForm}/>}
      </Card>}

      {itemsLoading || itemsError ? <State loading={itemsLoading} error={itemsError} retry={refreshItems}/> : categoryItems.length ? categoryItems.map((item) => <Card key={item.id}>
        <Row title={item.name} detail={[item.description, item.kitchenStation].filter(Boolean).join(' · ') || undefined} right={<Text style={{ color: colors.ink, fontWeight: '700' }}>{money(item.price, currency)}</Text>}/>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{item.available ? 'Available' : 'Unavailable'} · {item.active ? 'Active' : 'Inactive'} · Tax {item.taxBasisPoints / 100}%</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Button label="Edit" variant="secondary" onPress={() => editItem(item)}/></View>
          <View style={{ flex: 1 }}><Button label={item.available ? 'Unavailable' : 'Available'} variant="secondary" onPress={() => updateItem(item, { available: !item.available })}/></View>
        </View>
        <Button label={item.active ? 'Deactivate item' : 'Activate item'} variant="text" onPress={() => updateItem(item, { active: !item.active })}/>
      </Card>) : <State empty="No menu items in this category. Tap Add menu item to create one."/>}
    </>}
  </>;
}
