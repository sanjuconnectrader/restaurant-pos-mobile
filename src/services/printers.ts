import { PermissionsAndroid, Platform, NativeModules } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { BleManager } from 'react-native-ble-plx';
import { listBluetoothPrinters, listUsbPrinters, print, type PrintSection } from 'universal-thermal-printer';

export type ReceiptPrinter = { type: 'bluetooth' | 'usb'; address: string; name: string };
const key = 'receipt_printer';

async function bluetoothPermission() {
  if (Platform.OS !== 'android') return true;
  const permission = Number(Platform.Version) >= 31
    ? [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]
    : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  const result = await PermissionsAndroid.requestMultiple(permission);
  return permission.every((item) => result[item] === PermissionsAndroid.RESULTS.GRANTED);
}

export async function discoverPrinters() {
  const found: ReceiptPrinter[] = [];
  const errors: string[] = [];
  if (await bluetoothPermission()) {
    try {
      const devices = await listBluetoothPrinters();
      for (const device of devices) if (!found.some((item) => item.address === device.address))
        found.push({ type: 'bluetooth', address: device.address, name: device.name });
    } catch (error) { errors.push(`Bluetooth: ${String(error)}`); }
  } else errors.push('Bluetooth permission denied');
  if (Platform.OS === 'android') {
    try {
      const devices = await listUsbPrinters();
      for (const device of devices) found.push({ type: 'usb', address: device.deviceId, name: device.name });
    } catch (error) { errors.push(`USB: ${String(error)}`); }
  }
  return { found, errors };
}

export async function connectPrinter(printer: ReceiptPrinter) {
  if (printer.type === 'usb') {
    const [vendorId, productId] = printer.address.split(':').map(Number);
    const usb = NativeModules.UniversalThermalUsb;
    if (!usb) throw new Error('USB printer module needs an Android development build');
    if (!await usb.requestPermission(vendorId, productId)) throw new Error('USB access was denied');
    await usb.connect(vendorId, productId);
    await usb.disconnect();
  } else {
    if (!await bluetoothPermission()) throw new Error('Bluetooth permission was denied');
    const manager = new BleManager();
    try {
      const device = await manager.connectToDevice(printer.address, { timeout: 10000 });
      await device.discoverAllServicesAndCharacteristics();
      const services = await device.services();
      if (!services.some((service) => service.uuid.toLowerCase() === '6e400001-b5a3-f393-e0a9-e50e24dcca9e'))
        throw new Error('This Bluetooth device does not support the receipt printer BLE service');
      await manager.cancelDeviceConnection(printer.address);
    } finally { manager.destroy(); }
  }
  await SecureStore.setItemAsync(key, JSON.stringify(printer));
}

export async function selectedPrinter(): Promise<ReceiptPrinter | null> {
  const value = await SecureStore.getItemAsync(key);
  if (!value) return null;
  try { return JSON.parse(value) as ReceiptPrinter; } catch { return null; }
}

export async function printToPrinter(printer: ReceiptPrinter, sections: PrintSection[]) {
  return print(printer.type, printer.address, sections);
}
