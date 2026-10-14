import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Category, MenuItem, pos } from '../api/pos';
import { messageOf } from '../api/client';
import { useLive } from '../hooks/useLive';
import { useAuth } from '../store/auth';
import { colors } from '../theme/colors';
import { Button, Card, Field, Section, State, money } from './Kit';
import { Icon } from './Icon';

const gap = 12;

export function MenuManager() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 720) - 40;
  const categoryColumns = contentWidth >= 600 ? 3 : contentWidth >= 390 ? 2 : 1;
  const categoryWidth = (contentWidth - gap * (categoryColumns - 1)) / categoryColumns;
  const itemColumns = contentWidth >= 600 ? 3 : 2;
  const itemWidth = (contentWidth - gap * (itemColumns - 1)) / itemColumns;
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

  function deleteCategory(category: Category) {
    const count = items.filter((item) => item.categoryId === category.id).length;
    Alert.alert('Delete category?', count ? `${category.name} and its ${count} menu ${count === 1 ? 'item' : 'items'} will be removed from the menu. Past orders will be preserved.` : `${category.name} will be removed from the menu.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setBusy(true);
        try { await pos.removeCategory(category.id); if (selectedId === category.id) setSelectedId(null); closeCategoryForm(); await Promise.all([refreshCategories(), refreshItems()]); }
        catch (error) { Alert.alert('Could not delete category', messageOf(error)); }
        finally { setBusy(false); }
      } },
    ]);
  }

  function deleteItem(item: MenuItem) {
    Alert.alert('Delete menu item?', `${item.name} will be removed from the menu. Past orders will be preserved.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setBusy(true);
        try { await pos.removeMenu(item.id); if (editingItemId === item.id) closeItemForm(); await refreshItems(); }
        catch (error) { Alert.alert('Could not delete menu item', messageOf(error)); }
        finally { setBusy(false); }
      } },
    ]);
  }

  return <>
    <View style={styles.search}>
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
      <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Categories</Text><Text style={styles.sectionSubtitle}>Organize items for a faster checkout</Text></View><Text style={styles.count}>{categories.length} total</Text></View>
      <Button label={categoryFormOpen && !editingCategoryId ? 'Close form' : 'Add category'} icon={categoryFormOpen && !editingCategoryId ? undefined : 'plus'} variant="secondary" onPress={() => {
        if (categoryFormOpen && !editingCategoryId) closeCategoryForm();
        else { setEditingCategoryId(null); setCategoryName(''); setCategoryFormOpen(true); }
      }}/>
    </>}

    {categoryFormOpen && <Card style={styles.formCard}>
      <View><Text style={styles.formTitle}>{editingCategoryId ? 'Edit category' : 'New category'}</Text><Text style={styles.formSubtitle}>Choose a short, recognizable name.</Text></View>
      <Field label="Category name" value={categoryName} onChangeText={setCategoryName} placeholder="e.g. Starters" autoFocus maxLength={255}/>
      <View style={styles.formActions}><View style={styles.actionFlex}><Button label="Cancel" variant="secondary" onPress={closeCategoryForm}/></View><View style={styles.actionFlex}><Button label={editingCategoryId ? 'Save changes' : 'Create category'} onPress={saveCategory} disabled={!categoryName.trim()} loading={busy}/></View></View>
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
          style={[styles.categoryCard, { width: categoryWidth }, active && styles.categoryCardActive]}>
          <View style={styles.categoryTop}><View style={styles.categoryIcon}><Icon name="grid" size={19} color={colors.accent}/></View><Icon name="chevron" size={17} color={colors.muted}/></View>
          <View>
            <Text numberOfLines={2} style={styles.categoryName}>{category.name}</Text>
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>{count} {count === 1 ? 'item' : 'items'}{category.active ? '' : ' · Off'}</Text>
          </View>
        </Pressable>;
      })}
    </View> : <State empty={query ? 'No categories match your search.' : 'No categories yet. Add your first category above.'}/>)}

    {!!query && <>
      <Section title="Menu results" action={<Text style={{ color: colors.muted, fontSize: 13 }}>{matchingItems.length} found</Text>}/>
      {itemsLoading || itemsError ? <State loading={itemsLoading} error={itemsError} retry={refreshItems}/> : matchingItems.length ? <View style={styles.itemGrid}>{matchingItems.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Open ${item.name}`} onPress={() => { const category = categories.find((entry) => entry.id === item.categoryId); if (category) openCategory(category); }} style={[styles.itemCard, { width: itemWidth }]}><View style={styles.itemIcon}><Icon name="menu" size={19} color={colors.accent}/></View><View style={styles.itemIdentity}><Text numberOfLines={2} style={styles.itemName}>{item.name}</Text><Text numberOfLines={1} style={styles.itemCategory}>{categories.find((entry) => entry.id === item.categoryId)?.name || 'Category'}</Text><Text style={styles.itemPrice}>{money(item.price, currency)}</Text></View><Text style={styles.activeText}>{item.available ? 'Available' : 'Unavailable'} · {item.active ? 'Active' : 'Inactive'}</Text><Text style={styles.itemActionText}>Open category ›</Text></Pressable>)}</View> : <State empty="No menu items match your search."/>}
    </>}

    {!query && selected && <>
      <Pressable accessibilityRole="button" onPress={() => { setSelectedId(null); closeItemForm(); closeCategoryForm(); }} style={styles.backLink}><Icon name="back" size={18} color={colors.accent}/><Text style={styles.backText}>All categories</Text></Pressable>
      <Card style={styles.selectedCard}>
        <Text style={styles.eyebrow}>CATEGORY</Text>
        <Text style={styles.selectedTitle}>{selected.name}</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{categoryItems.length} menu {categoryItems.length === 1 ? 'item' : 'items'} · {selected.active ? 'Active' : 'Inactive'}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Button label="Edit" variant="secondary" onPress={() => { setCategoryName(selected.name); setEditingCategoryId(selected.id); setCategoryFormOpen(true); }}/></View>
          <View style={{ flex: 1 }}><Button label={selected.active ? 'Disable' : 'Enable'} variant="secondary" onPress={() => updateCategory(!selected.active)}/></View>
        </View>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => deleteCategory(selected)} style={styles.deleteCategory}><Text style={styles.deleteCategoryText}>Delete category</Text></Pressable>
      </Card>

      <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Menu items</Text><Text style={styles.sectionSubtitle}>Manage pricing and availability</Text></View><Text style={styles.count}>{categoryItems.length} total</Text></View>
      <Button label={itemFormOpen && !editingItemId ? 'Cancel' : 'Add menu item'} icon={itemFormOpen && !editingItemId ? undefined : 'plus'} disabled={!selected.active} onPress={() => {
        if (itemFormOpen && !editingItemId) closeItemForm();
        else { closeItemForm(); setItemFormOpen(true); }
      }}/>

      {itemFormOpen && <Card style={styles.formCard}>
        <View><Text style={styles.formTitle}>{editingItemId ? 'Edit menu item' : `Add to ${selected.name}`}</Text><Text style={styles.formSubtitle}>Keep details clear for your team and guests.</Text></View>
        <Field label="Item name" value={itemName} onChangeText={setItemName} placeholder="e.g. Grilled paneer"/>
        <Field label="Description (optional)" value={description} onChangeText={setDescription} placeholder="A short description" multiline/>
        <View style={styles.fieldGrid}><View style={styles.actionFlex}><Field label="Price" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0.00" error={price.trim() && (!Number.isFinite(Number(price)) || Number(price) < 0) ? 'Enter a valid price' : undefined}/></View><View style={styles.actionFlex}><Field label="Tax %" value={tax} onChangeText={setTax} keyboardType="decimal-pad" placeholder="0" error={!Number.isFinite(Number(tax)) || Number(tax) < 0 || Number(tax) > 100 ? 'Use 0–100' : undefined}/></View></View>
        <Field label="Kitchen station (optional)" value={station} onChangeText={setStation}/>
        <View style={styles.formActions}><View style={styles.actionFlex}><Button label="Cancel" variant="secondary" onPress={closeItemForm}/></View><View style={styles.actionFlex}><Button label={editingItemId ? 'Save changes' : 'Create item'} loading={busy} disabled={!itemName.trim() || !price.trim() || !Number.isFinite(Number(price)) || Number(price) < 0 || !Number.isFinite(Number(tax)) || Number(tax) < 0 || Number(tax) > 100} onPress={saveItem}/></View></View>
      </Card>}

      {itemsLoading || itemsError ? <State loading={itemsLoading} error={itemsError} retry={refreshItems}/> : categoryItems.length ? <View style={styles.itemGrid}>{categoryItems.map((item) => <View key={item.id} style={[styles.itemCard, { width: itemWidth }]}>
        <View style={styles.itemTop}><View style={styles.itemIcon}><Icon name="menu" size={19} color={colors.accent}/></View><Pressable accessibilityRole="button" accessibilityLabel={`${item.available ? 'Mark unavailable' : 'Mark available'}: ${item.name}`} onPress={() => updateItem(item, { available: !item.available })} style={[styles.availability, !item.available && styles.unavailable]}><View style={[styles.availabilityDot, !item.available && styles.unavailableDot]}/><Text numberOfLines={1} style={[styles.availabilityText, !item.available && styles.unavailableText]}>{item.available ? 'Available' : 'Off'}</Text></Pressable></View>
        <View style={styles.itemIdentity}><Text numberOfLines={2} style={styles.itemName}>{item.name}</Text><Text numberOfLines={1} style={styles.itemCategory}>{selected.name}</Text><Text numberOfLines={1} style={styles.itemPrice}>{money(item.price, currency)}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`${item.active ? 'Deactivate' : 'Activate'} ${item.name}`} onPress={() => updateItem(item, { active: !item.active })} style={styles.activeToggle}><Text style={styles.activeText}>{item.active ? 'Active · tap to disable' : 'Inactive · tap to enable'}</Text></Pressable>
        <View style={styles.itemActions}><Pressable accessibilityRole="button" accessibilityLabel={`Edit ${item.name}`} onPress={() => editItem(item)} style={styles.itemAction}><Text style={styles.itemActionText}>Edit</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Delete ${item.name}`} disabled={busy} onPress={() => deleteItem(item)} style={styles.itemAction}><Text style={styles.itemDeleteText}>Delete</Text></Pressable></View>
      </View>)}</View> : <State empty="No menu items in this category. Tap Add menu item to create one."/>}
    </>}
  </>;
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, minHeight: 52 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, marginTop: 6 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  sectionSubtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  count: { color: colors.muted, fontSize: 12, paddingBottom: 2 },
  formCard: { borderRadius: 18, padding: 18, gap: 15 },
  formTitle: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  formSubtitle: { color: colors.muted, fontSize: 13, marginTop: 4 },
  formActions: { flexDirection: 'row', gap: 10 },
  actionFlex: { flex: 1 },
  fieldGrid: { flexDirection: 'row', gap: 12 },
  categoryCard: { minHeight: 128, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 14, justifyContent: 'space-between', gap: 12 },
  categoryCardActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  categoryTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  categoryIcon: { width: 35, height: 35, borderRadius: 10, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  categoryName: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  categoryMeta: { color: colors.muted, fontSize: 11, marginTop: 5 },
  backLink: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start' },
  backText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  selectedCard: { backgroundColor: '#EDF5F1', borderColor: '#D7E9E0', borderRadius: 18, padding: 18, gap: 11 },
  eyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 1.1, fontWeight: '800' },
  selectedTitle: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  deleteCategory: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
  deleteCategoryText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap },
  itemCard: { minHeight: 220, borderRadius: 16, padding: 11, gap: 9, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: 'space-between' },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 },
  itemIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  availability: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.accentSoft, paddingHorizontal: 5, paddingVertical: 5, borderRadius: 9, maxWidth: '72%' },
  unavailable: { backgroundColor: colors.background }, availabilityDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent }, unavailableDot: { backgroundColor: colors.muted }, availabilityText: { color: colors.accent, fontSize: 9, fontWeight: '700', flexShrink: 1 }, unavailableText: { color: colors.muted },
  itemIdentity: { gap: 3, flex: 1 }, itemName: { minHeight: 36, color: colors.ink, fontSize: 14, lineHeight: 18, fontWeight: '700' }, itemCategory: { color: colors.muted, fontSize: 11 }, itemPrice: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 3 },
  activeToggle: { minHeight: 25, justifyContent: 'center' }, activeText: { color: colors.muted, fontSize: 10 }, itemActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 4 }, itemAction: { flex: 1, minHeight: 33, alignItems: 'center', justifyContent: 'center' }, itemActionText: { color: colors.accent, fontSize: 12, fontWeight: '700' }, itemDeleteText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
});
