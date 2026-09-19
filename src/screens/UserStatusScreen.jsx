import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomHeader from '../components/CustomHeader';
import { colors } from '../utils/color';
import { API_URL } from '@env';
import { useNavigation } from '@react-navigation/native';

const UserStatusScreen = () => {
  const navigation = useNavigation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [updatingIds, setUpdatingIds] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}users.php`);
      if (
        response.data &&
        (response.data.status === 'true' || response.data.status === true)
      ) {
        setUsers(response.data.data || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.log('Error fetching users:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch users list.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleToggleLoginStatus = async user => {
    const userId = user.id;
    if (updatingIds[userId]) return;

    const currentStatus = String(user.login_status || '0');
    const newStatus = currentStatus === '0' ? '1' : '0';

    setUpdatingIds(prev => ({ ...prev, [userId]: true }));

    // Optimistic update
    setUsers(prevUsers =>
      prevUsers.map(u =>
        u.id === userId ? { ...u, login_status: newStatus } : u,
      ),
    );

    try {
      const formData = new FormData();
      formData.append('id', String(userId));
      formData.append('inactive', String(user.inactive || '0'));
      formData.append('login_status', newStatus);
      formData.append('login_active_status', '0');

      const response = await axios.post(`${API_URL}logout_post.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (
        response.data &&
        (response.data.status === 'true' || response.data.status === true)
      ) {
        Toast.show({
          type: 'success',
          text1: 'Status Updated',
          text2: `${user.real_name} login status set to ${
            newStatus === '0' ? 'Login' : 'Logout'
          }.`,
        });
      } else {
        // Rollback
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u.id === userId ? { ...u, login_status: currentStatus } : u,
          ),
        );
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: response.data?.message || 'Could not update login status.',
        });
      }
    } catch (error) {
      console.log('Error updating login status:', error);
      // Rollback
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, login_status: currentStatus } : u,
        ),
      );
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Failed to update login status.',
      });
    } finally {
      setUpdatingIds(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  };

  const handleToggleActiveStatus = async user => {
    const userId = user.id;
    if (updatingIds[userId]) return;

    const currentInactive = String(user.inactive || '0');
    const newInactive = currentInactive === '0' ? '1' : '0';

    setUpdatingIds(prev => ({ ...prev, [userId]: true }));

    // Optimistic update
    setUsers(prevUsers =>
      prevUsers.map(u =>
        u.id === userId ? { ...u, inactive: newInactive } : u,
      ),
    );

    try {
      const formData = new FormData();
      formData.append('id', String(userId));
      formData.append('inactive', newInactive);
      formData.append('login_status', String(user.login_status || '0'));
      formData.append('login_active_status', '1');

      const response = await axios.post(`${API_URL}logout_post.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (
        response.data &&
        (response.data.status === 'true' || response.data.status === true)
      ) {
        Toast.show({
          type: 'success',
          text1: 'Status Updated',
          text2: `${user.real_name || user.user_id} is now ${
            newInactive === '0' ? 'Active' : 'Inactive'
          }.`,
        });
      } else {
        // Rollback
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u.id === userId ? { ...u, inactive: currentInactive } : u,
          ),
        );
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: response.data?.message || 'Could not update active status.',
        });
      }
    } catch (error) {
      console.log('Error updating active status:', error);
      // Rollback
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, inactive: currentInactive } : u,
        ),
      );
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Failed to update active status.',
      });
    } finally {
      setUpdatingIds(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  };

  const counts = useMemo(() => {
    let loggedIn = 0;
    let loggedOut = 0;
    let active = 0;
    let inactive = 0;

    users.forEach(u => {
      if (String(u.login_status) === '0') loggedIn++;
      else loggedOut++;

      if (String(u.inactive) === '0') active++;
      else inactive++;
    });

    return {
      total: users.length,
      loggedIn,
      loggedOut,
      active,
      inactive,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (user.real_name && user.real_name.toLowerCase().includes(q)) ||
        (user.user_id && user.user_id.toLowerCase().includes(q)) ||
        (user.emp_code && String(user.emp_code).toLowerCase().includes(q)) ||
        (user.phone && String(user.phone).includes(q));

      if (!matchesSearch) return false;

      if (filterType === 'login') return String(user.login_status) === '0';
      if (filterType === 'logout') return String(user.login_status) === '1';
      if (filterType === 'active') return String(user.inactive) === '0';
      if (filterType === 'inactive') return String(user.inactive) === '1';

      return true;
    });
  }, [users, searchQuery, filterType]);

  const renderFilterChip = (type, label, count) => {
    const isSelected = filterType === type;
    return (
      <TouchableOpacity
        key={type}
        style={[styles.filterChip, isSelected && styles.activeFilterChip]}
        onPress={() => setFilterType(type)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterChipText,
            isSelected && styles.activeFilterChipText,
          ]}
        >
          {label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderUserItem = ({ item }) => {
    const isLogin = String(item.login_status) === '0';
    const isActive = String(item.inactive) === '0';
    const isUpdating = !!updatingIds[item.id];

    return (
      <View style={styles.userCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatarCircle,
                isActive ? styles.avatarActive : styles.avatarInactive,
              ]}
            >
              <Text style={styles.avatarText}>
                {(item.real_name || item.user_id || 'U')
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>
            <View
              style={[
                styles.statusDot,
                isActive
                  ? isLogin
                    ? styles.statusDotActiveLogin
                    : styles.statusDotActiveLogout
                  : styles.statusDotInactive,
              ]}
            />
          </View>

          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.realName} numberOfLines={1}>
                {item.real_name || 'No Name'}
              </Text>
              {item.emp_code ? (
                <View style={styles.empBadge}>
                  <Text style={styles.empBadgeText}>#{item.emp_code}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.usernameText}>@{item.user_id}</Text>

            <View style={styles.metaRow}>
              {item.phone ? (
                <View style={styles.metaItem}>
                  <Ionicons
                    name="call-outline"
                    size={12}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.metaText}>{item.phone}</Text>
                </View>
              ) : null}
              {item.email ? (
                <View style={styles.metaItem}>
                  <Ionicons
                    name="mail-outline"
                    size={12}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {item.email}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {isUpdating && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.inlineLoader}
            />
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.controlsRow}>
          {/* Login Status Toggle */}
          <TouchableOpacity
            style={[
              styles.checkboxContainer,
              isLogin ? styles.checkboxLoginActiveBg : styles.checkboxLoginInactiveBg,
            ]}
            disabled={isUpdating}
            onPress={() => handleToggleLoginStatus(item)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isLogin ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={22}
              color={isLogin ? colors.success : colors.textSecondary}
            />
            <View style={styles.checkboxLabelContainer}>
              <Text style={styles.controlLabel}>Login Status</Text>
              <Text
                style={[
                  styles.controlValue,
                  { color: isLogin ? colors.success : colors.textSecondary },
                ]}
              >
                {isLogin ? 'Logged In' : 'Logged Out'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Active Status Toggle */}
          <TouchableOpacity
            style={[
              styles.checkboxContainer,
              isActive ? styles.checkboxActiveBg : styles.checkboxDangerBg,
            ]}
            disabled={isUpdating}
            onPress={() => handleToggleActiveStatus(item)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isActive ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={22}
              color={isActive ? colors.primary : colors.danger}
            />
            <View style={styles.checkboxLabelContainer}>
              <Text style={styles.controlLabel}>User Status</Text>
              <Text
                style={[
                  styles.controlValue,
                  { color: isActive ? colors.primaryLight : colors.danger },
                ]}
              >
                {isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <StatusBar backgroundColor={colors.background} barStyle="light-content" />
      <CustomHeader
        title="User Status"
        onBackPress={() => navigation.goBack()}
      />

      {/* Summary Stat Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{counts.total}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: colors.success }]}>
            {counts.loggedIn}
          </Text>
          <Text style={styles.statLabel}>Logged In</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {counts.active}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, emp code, user id..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterScrollContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { type: 'all', label: 'All', count: counts.total },
            { type: 'login', label: 'Logged In', count: counts.loggedIn },
            { type: 'logout', label: 'Logged Out', count: counts.loggedOut },
            { type: 'active', label: 'Active', count: counts.active },
            { type: 'inactive', label: 'Inactive', count: counts.inactive },
          ]}
          keyExtractor={item => item.type}
          renderItem={({ item }) =>
            renderFilterChip(item.type, item.label, item.count)
          }
          contentContainerStyle={styles.filterChipsContent}
        />
      </View>

      {/* User List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => String(item.id)}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="people-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default UserStatusScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D352E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#3D352E',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.text,
    paddingVertical: 0,
  },
  filterScrollContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  filterChipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: '#3D352E',
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  activeFilterChipText: {
    color: '#1C1A17',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
  },
  userCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3D352E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarActive: {
    backgroundColor: colors.primary,
  },
  avatarInactive: {
    backgroundColor: '#4B433B',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: colors.card,
  },
  statusDotActiveLogin: {
    backgroundColor: colors.success,
  },
  statusDotActiveLogout: {
    backgroundColor: '#F59E0B',
  },
  statusDotInactive: {
    backgroundColor: colors.danger,
  },
  inlineLoader: {
    marginLeft: 8,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  realName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  empBadge: {
    backgroundColor: '#3D352E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  empBadgeText: {
    fontSize: 11,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  usernameText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: '#3D352E',
    marginVertical: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  checkboxContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  checkboxLoginActiveBg: {
    backgroundColor: 'rgba(93, 193, 116, 0.12)',
    borderColor: 'rgba(93, 193, 116, 0.3)',
  },
  checkboxLoginInactiveBg: {
    backgroundColor: 'rgba(199, 195, 191, 0.06)',
    borderColor: '#3D352E',
  },
  checkboxActiveBg: {
    backgroundColor: 'rgba(213, 155, 67, 0.12)',
    borderColor: 'rgba(213, 155, 67, 0.3)',
  },
  checkboxDangerBg: {
    backgroundColor: 'rgba(233, 77, 59, 0.12)',
    borderColor: 'rgba(233, 77, 59, 0.3)',
  },
  checkboxLabelContainer: {
    marginLeft: 8,
  },
  controlLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  controlValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loaderText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
