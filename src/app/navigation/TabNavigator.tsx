import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { TouchableOpacity } from 'react-native';
import { Colors } from '@constants/theme';
import { type TabParamList } from './types';
import { HomeScreen } from '@screens/HomeScreen';
import { SearchScreen } from '@screens/SearchScreen';
import { CartScreen } from '@screens/CartScreen';
import { WishlistScreen } from '@screens/WishlistScreen';
import { ProfileNavigator } from './ProfileNavigator';

const Tab = createBottomTabNavigator<TabParamList>();

type IonName = React.ComponentProps<typeof Ionicons>['name'];

interface TabCfg {
  label: string;
  icon: IonName;
  iconActive: IonName;
  badge?: number;          // optional badge count
}

const TABS: Record<keyof TabParamList, TabCfg> = {
  Home:     { label: 'Trang chủ', icon: 'home-outline',          iconActive: 'home-sharp' },
  Search:   { label: 'Tìm kiếm',  icon: 'search-outline',        iconActive: 'search-sharp' },
  Cart:     { label: 'Giỏ hàng',  icon: 'cart-outline',          iconActive: 'cart-sharp',   badge: 0 },
  Wishlist: { label: 'Yêu thích', icon: 'heart-outline',         iconActive: 'heart-sharp' },
  Profile:  { label: 'Hồ sơ',     icon: 'person-circle-outline', iconActive: 'person-circle-sharp' },
};

const SCREENS: Record<keyof TabParamList, React.ComponentType<object>> = {
  Home:     HomeScreen,
  Search:   SearchScreen,
  Cart:     CartScreen,
  Wishlist: WishlistScreen,
  Profile:  ProfileNavigator,
};

// ── Custom tab button ──────────────────────────────────

function TabButton(props: BottomTabBarButtonProps & { cfg: TabCfg; focused: boolean }) {
  const { cfg, focused, onPress, onLongPress, children: _c, style: _s, ...rest } = props;
  return (
    <TouchableOpacity
      style={S.tabBtn}
      activeOpacity={0.75}
      onPress={onPress}
      onLongPress={onLongPress}
      {...rest}
    >
      {/* Active indicator bar at top */}
      <View style={[S.tabIndicator, focused && S.tabIndicatorActive]} />

      {/* Icon container */}
      <View style={[S.iconWrap, focused && S.iconWrapActive]}>
        <Ionicons
          name={focused ? cfg.iconActive : cfg.icon}
          size={21}
          color={focused ? Colors.primary : Colors.textMuted}
        />
        {/* Badge */}
        {cfg.badge != null && cfg.badge > 0 && (
          <View style={S.badge}>
            <Text style={S.badgeText}>{cfg.badge > 99 ? '99+' : cfg.badge}</Text>
          </View>
        )}
      </View>

      {/* Label */}
      <Text style={[S.tabLabel, focused && S.tabLabelActive]} numberOfLines={1}>
        {cfg.label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Navigator ─────────────────────────────────────────

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: S.bar,
      }}
    >
      {(Object.keys(TABS) as Array<keyof TabParamList>).map((name) => {
        const cfg = TABS[name];
        return (
          <Tab.Screen
            key={name}
            name={name}
            component={SCREENS[name]}
            options={{
              tabBarButton: (props) => (
                <TabButton {...props} cfg={cfg} focused={props.accessibilityState?.selected ?? false} />
              ),
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
}

// ── Styles ────────────────────────────────────────────

const BAR_H = Platform.OS === 'ios' ? 80 : 62;

const S = StyleSheet.create({
  // The tab bar container
  bar: {
    backgroundColor: Colors.surface,
    height: BAR_H,
    paddingBottom: Platform.OS === 'ios' ? 18 : 0,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 20,
  },

  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    gap: 3,
  },

  tabIndicator: {
    width: '50%',
    height: 2.5,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginBottom: 6,
  },
  tabIndicatorActive: {
    backgroundColor: Colors.primary,
  },

  iconWrap: {
    width: 38,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapActive: {
    backgroundColor: Colors.primaryLight,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textMuted,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 12,
  },
});
