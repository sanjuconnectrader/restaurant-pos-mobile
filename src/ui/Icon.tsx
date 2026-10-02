import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';
export type IconName = 'grid' | 'order' | 'table' | 'menu' | 'more' | 'back' | 'plus' | 'search' | 'user' | 'chart' | 'receipt' | 'calendar' | 'settings' | 'logout' | 'chevron' | 'wallet' | 'staff' | 'kitchen' | 'eye' | 'eyeOff';
export function Icon({ name, size = 22, color = colors.ink }: { name: IconName; size?: number; color?: string }) {
  const line = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const shapes: Record<IconName, React.ReactNode> = {
    grid: <><Rect x="3" y="3" width="7" height="7" rx="1" {...line}/><Rect x="14" y="3" width="7" height="7" rx="1" {...line}/><Rect x="3" y="14" width="7" height="7" rx="1" {...line}/><Rect x="14" y="14" width="7" height="7" rx="1" {...line}/></>,
    order: <><Rect x="5" y="3" width="14" height="18" rx="2" {...line}/><Line x1="8" y1="8" x2="16" y2="8" {...line}/><Line x1="8" y1="12" x2="16" y2="12" {...line}/><Line x1="8" y1="16" x2="13" y2="16" {...line}/></>,
    table: <><Rect x="4" y="7" width="16" height="9" rx="2" {...line}/><Line x1="7" y1="16" x2="7" y2="21" {...line}/><Line x1="17" y1="16" x2="17" y2="21" {...line}/></>,
    menu: <><Circle cx="12" cy="12" r="9" {...line}/><Line x1="4" y1="12" x2="20" y2="12" {...line}/><Line x1="9" y1="4" x2="9" y2="20" {...line}/></>,
    more: <><Circle cx="5" cy="12" r="1" fill={color}/><Circle cx="12" cy="12" r="1" fill={color}/><Circle cx="19" cy="12" r="1" fill={color}/></>,
    back: <Path d="M15 18l-6-6 6-6" {...line}/>, plus: <Path d="M12 5v14M5 12h14" {...line}/>,
    search: <><Circle cx="10.8" cy="10.8" r="6.8" {...line}/><Path d="m16 16 4.5 4.5" {...line}/></>,
    user: <><Circle cx="12" cy="8" r="4" {...line}/><Path d="M4 21c0-4 3-7 8-7s8 3 8 7" {...line}/></>,
    chart: <><Path d="M4 20V4M4 20h17M8 16v-5M13 16V7M18 16v-9" {...line}/></>,
    receipt: <Path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3zm3 5h6m-6 4h6" {...line}/>,
    calendar: <><Rect x="3" y="5" width="18" height="16" rx="2" {...line}/><Path d="M7 3v4m10-4v4M3 10h18" {...line}/></>,
    settings: <><Circle cx="12" cy="12" r="3" {...line}/><Circle cx="12" cy="12" r="9" {...line}/></>,
    logout: <Path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4m5-4 4-4-4-4m-8 4h12" {...line}/>,
    chevron: <Path d="m9 5 7 7-7 7" {...line}/>,
    wallet: <><Rect x="3" y="6" width="18" height="14" rx="2" {...line}/><Path d="M4 6V4h15M15 13h6" {...line}/></>,
    staff: <><Circle cx="9" cy="8" r="3" {...line}/><Path d="M3 19c0-4 2-6 6-6s6 2 6 6m2-14a3 3 0 0 1 0 6m0 2c3 0 5 2 5 6" {...line}/></>,
    kitchen: <><Path d="M4 16h16M6 16a6 6 0 0 1 12 0M12 7V5M4 20h16" {...line}/></>,
    eye: <><Path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" {...line}/><Circle cx="12" cy="12" r="3" {...line}/></>,
    eyeOff: <><Path d="M3 3l18 18M10 6.2A11 11 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.1 3.5M6.1 8.1A16 16 0 0 0 2 12s3.5 6 10 6c1.3 0 2.5-.2 3.6-.7M10.6 10.6a2 2 0 0 0 2.8 2.8" {...line}/></>,
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24">{shapes[name]}</Svg>;
}
