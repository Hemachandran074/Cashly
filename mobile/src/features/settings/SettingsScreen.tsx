import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  CreditCard,
  Calendar,
  MessageSquare,
  Palette,
  Download,
  LogOut,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Tag,
  Moon,
  Sun,
  MessageSquareQuote,
  Sparkles,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { theme, useAppTheme } from '../../theme';
import { useSettingsStore, ThemeMode } from './settingsStore';
import { useAuthStore } from '../auth/authStore';
import { PasteSmsModal } from '../transactions/PasteSmsModal.tsx';
import { formatIndianRupees, rupeesToPaise, paiseToRupees } from '../../utils/money';
import { formatFriendlyDate } from '../../utils/date';
import { Account } from '../../types/domain';
import { LiquidToggle, LiquidSegmentedControl } from '../../components/primitives';

export const SettingsScreen: React.FC = () => {
  const { colors, themeMode, isDark } = useAppTheme();
  const {
    name,
    trackingStartDate,
    smsPermissionStatus,
    accounts,
    customCategories,
    loadSettings,
    updateName,
    updateTrackingStartDate,
    updateSmsPermission,
    setThemeMode,
    addAccount,
    updateAccount,
    deleteAccount,
    addCustomCategory,
    exportDataJson,
  } = useSettingsStore();

  const { user, signOut } = useAuthStore();

  useEffect(() => {
    loadSettings();
  }, []);

  // Modals state
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [newName, setNewName] = useState(name);

  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<Account['type']>('BANK');
  const [accountBalanceRupees, setAccountBalanceRupees] = useState('');

  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [newDate, setNewDate] = useState(trackingStartDate);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [catName, setCatName] = useState('');
  const [catKind, setCatKind] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportedJson, setExportedJson] = useState('');
  const [pasteSmsModalVisible, setPasteSmsModalVisible] = useState(false);

  // 1. Profile Name Save
  const handleSaveName = async () => {
    if (!newName.trim()) return;
    await updateName(newName);
    setNameModalVisible(false);
  };

  // 2. Account Save / Edit
  const handleOpenAccountModal = (acc?: Account) => {
    if (acc) {
      setEditingAccountId(acc.id);
      setAccountName(acc.name);
      setAccountType(acc.type);
      setAccountBalanceRupees(paiseToRupees(acc.opening_balance_paise).toString());
    } else {
      setEditingAccountId(null);
      setAccountName('');
      setAccountType('BANK');
      setAccountBalanceRupees('');
    }
    setAccountModalVisible(true);
  };

  const handleSaveAccount = async () => {
    if (!accountName.trim()) return;
    const paise = rupeesToPaise(parseFloat(accountBalanceRupees) || 0);

    if (editingAccountId) {
      await updateAccount(editingAccountId, {
        name: accountName.trim(),
        type: accountType,
        opening_balance_paise: paise,
      });
    } else {
      await addAccount({
        name: accountName.trim(),
        type: accountType,
        opening_balance_paise: paise,
      });
    }
    setAccountModalVisible(false);
  };

  // 3. Category Save
  const handleSaveCategory = async () => {
    if (!catName.trim()) return;
    await addCustomCategory(catName.trim(), 'tag', catKind);
    setCatName('');
    setCategoryModalVisible(false);
  };

  // 4. Export Share
  const handleExport = () => {
    const json = exportDataJson();
    setExportedJson(json);
    setExportModalVisible(true);
  };

  const handleShareJson = async () => {
    try {
      await Share.share({
        title: 'Cashly Ledger Export',
        message: exportedJson,
      });
    } catch {
      // User cancelled
    }
  };

  // 5. Sign Out Confirmation
  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Cashly?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={colors.statusBar} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Manage your profile, accounts, and preferences</Text>
        </View>

        {/* 1. User Profile Card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.cardHighlight, borderColor: colors.borderStrong }]}>
              <Text style={[styles.avatarInitial, { color: colors.text }]}>{name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>{name}</Text>
              <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{user?.email || 'Logged in locally'}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setNewName(name);
                setNameModalVisible(true);
              }}
              style={[styles.editButton, { backgroundColor: colors.cardHighlight }]}
              activeOpacity={0.7}
            >
              <Edit2 size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Whole App Appearance Theme Mode */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>App Appearance</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              {themeMode === 'dark' ? (
                <Moon size={20} color={colors.text} strokeWidth={2} />
              ) : (
                <Sun size={20} color={colors.text} strokeWidth={2} />
              )}
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Theme Mode</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                  {themeMode === 'dark' ? 'Dark Mode (Pitch Black)' : 'Light Mode (High Contrast)'}
                </Text>
              </View>
            </View>

            <LiquidSegmentedControl<'dark' | 'light'>
              options={[
                { id: 'dark', label: 'Dark' },
                { id: 'light', label: 'Light' },
              ]}
              selectedId={themeMode === 'light' ? 'light' : 'dark'}
              onSelect={(val) => setThemeMode(val)}
              style={styles.cardStyleToggle}
              activeBackgroundColor={isDark ? '#FFFFFF' : '#000000'}
              inactiveBackgroundColor={isDark ? '#222226' : '#E4E4E7'}
              activeTextColor={isDark ? '#000000' : '#FFFFFF'}
              inactiveTextColor={isDark ? '#A1A1AA' : '#71717A'}
            />
          </View>
        </View>

        {/* 3. Accounts & Balances */}
        <View style={styles.headingWithAction}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>Accounts & Balances</Text>
          <TouchableOpacity
            onPress={() => handleOpenAccountModal()}
            style={[styles.addSmallButton, { backgroundColor: colors.text }]}
            activeOpacity={0.7}
          >
            <Plus size={14} color={colors.textInverted} />
            <Text style={[styles.addSmallText, { color: colors.textInverted }]}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {accounts.map((acc, index) => (
            <View key={acc.id}>
              {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <TouchableOpacity
                onPress={() => handleOpenAccountModal(acc)}
                style={styles.accountItem}
                activeOpacity={0.7}
              >
                <View style={styles.accountItemLeft}>
                  <Text style={[styles.accountTypeBadge, { backgroundColor: colors.cardHighlight, borderColor: colors.borderStrong, color: colors.textSecondary }]}>{acc.type}</Text>
                  <View>
                    <Text style={[styles.accountItemName, { color: colors.text }]}>{acc.name}</Text>
                    <Text style={[styles.accountItemBalance, { color: colors.textMuted }]}>
                      Baseline: {formatIndianRupees(acc.opening_balance_paise)}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* 4. Tracking Start Date */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>Financial Timeline</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => {
              setNewDate(trackingStartDate);
              setDateModalVisible(true);
            }}
            style={styles.settingItem}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Calendar size={20} color={colors.text} strokeWidth={2} />
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Tracking Start Date</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                  {formatFriendlyDate(trackingStartDate, { includeYear: true })}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 5. SMS Permission Status */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>SMS Detection</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MessageSquare size={20} color={colors.text} strokeWidth={2} />
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Auto-Read Financial SMS</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                  {smsPermissionStatus === 'GRANTED' ? 'Enabled' : 'Disabled (Paste Mode)'}
                </Text>
              </View>
            </View>
            <LiquidToggle
              checked={smsPermissionStatus === 'GRANTED'}
              onToggle={() => {
                const nextStatus =
                  smsPermissionStatus === 'GRANTED' ? 'SKIPPED' : 'GRANTED';
                updateSmsPermission(nextStatus);
              }}
              activeTrackColor="#10B981"
              inactiveTrackColor={colors.cardHighlight}
              accessibilityLabel="Auto-Read Financial SMS"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            onPress={() => setPasteSmsModalVisible(true)}
            style={styles.settingItem}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <MessageSquareQuote size={20} color={colors.text} strokeWidth={2} />
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Paste SMS</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                  Auto-detect amount, date & auto-ignore OTP/security
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 6. Custom Categories */}
        <View style={styles.headingWithAction}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>Custom Categories</Text>
          <TouchableOpacity
            onPress={() => setCategoryModalVisible(true)}
            style={[styles.addSmallButton, { backgroundColor: colors.text }]}
            activeOpacity={0.7}
          >
            <Plus size={14} color={colors.textInverted} />
            <Text style={[styles.addSmallText, { color: colors.textInverted }]}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {customCategories.length === 0 ? (
            <Text style={[styles.emptyNote, { color: colors.textMuted }]}>
              No custom categories yet. Tap Add to create one.
            </Text>
          ) : (
            customCategories.map((cat, idx) => (
              <View key={cat.id}>
                {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <View style={styles.categoryItem}>
                  <View style={styles.categoryItemLeft}>
                    <Tag size={16} color={colors.textMuted} />
                    <Text style={[styles.categoryItemName, { color: colors.text }]}>{cat.name}</Text>
                  </View>
                  <Text style={[styles.categoryItemKind, { color: colors.textMuted }]}>{cat.kind}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 7. Data Controls & Sign Out */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>Data & Account</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            onPress={handleExport}
            style={styles.settingItem}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Download size={20} color={colors.text} strokeWidth={2} />
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Export Ledger Data</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>Download or share JSON backup</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            onPress={handleSignOut}
            style={styles.settingItem}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <LogOut size={20} color="#EF4444" strokeWidth={2} />
              <View>
                <Text style={[styles.settingTitle, { color: '#EF4444' }]}>
                  Sign Out
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>Log out of this device</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── MODALS ── */}

      {/* Modal 1: Edit Name */}
      <Modal visible={nameModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalHeading, { color: colors.text }]}>Edit Name</Text>
            <Text style={[styles.modalHelp, { color: colors.textMuted }]}>
              This name is shown at the top of your Home Balance Card.
            </Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Your Name"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                onPress={() => setNameModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveName}
                style={[styles.modalSubmitBtn, { backgroundColor: colors.text }]}
              >
                <Text style={[styles.modalSubmitText, { color: colors.textInverted }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Add/Edit Account */}
      <Modal visible={accountModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalHeading, { color: colors.text }]}>
              {editingAccountId ? 'Edit Account' : 'New Account'}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Account Name</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={accountName}
                onChangeText={setAccountName}
                placeholder="e.g. HDFC Bank, Cash"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Account Type</Text>
              <View style={styles.typeSelectorRow}>
                {(['BANK', 'CASH', 'WALLET', 'UPI'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setAccountType(t)}
                    style={[
                      styles.typeSelectorBtn,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      accountType === t && [styles.typeSelectorBtnActive, { backgroundColor: colors.text, borderColor: colors.text }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeSelectorText,
                        { color: colors.textMuted },
                        accountType === t && [styles.typeSelectorTextActive, { color: colors.textInverted }],
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Starting Baseline Balance (₹)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={accountBalanceRupees}
                onChangeText={setAccountBalanceRupees}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalButtonRow}>
              {editingAccountId && accounts.length > 1 && (
                <TouchableOpacity
                  onPress={async () => {
                    await deleteAccount(editingAccountId);
                    setAccountModalVisible(false);
                  }}
                  style={styles.modalDeleteBtn}
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                onPress={() => setAccountModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveAccount}
                style={[styles.modalSubmitBtn, { backgroundColor: colors.text }]}
              >
                <Text style={[styles.modalSubmitText, { color: colors.textInverted }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 3: Tracking Start Date */}
      <Modal visible={dateModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalHeading, { color: colors.text }]}>Tracking Start Date</Text>
            <Text style={[styles.modalHelp, { color: colors.textMuted }]}>
              Transactions before this date will not alter your balance totals.
            </Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={newDate}
              onChangeText={setNewDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                onPress={() => setDateModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  await updateTrackingStartDate(newDate);
                  setDateModalVisible(false);
                }}
                style={[styles.modalSubmitBtn, { backgroundColor: colors.text }]}
              >
                <Text style={[styles.modalSubmitText, { color: colors.textInverted }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 4: Add Custom Category */}
      <Modal visible={categoryModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalHeading, { color: colors.text }]}>New Category</Text>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category Name</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={catName}
                onChangeText={setCatName}
                placeholder="e.g. Freelance, Gadgets"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Kind</Text>
              <View style={styles.typeSelectorRow}>
                {(['EXPENSE', 'INCOME'] as const).map((k) => (
                  <TouchableOpacity
                    key={k}
                    onPress={() => setCatKind(k)}
                    style={[
                      styles.typeSelectorBtn,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      catKind === k && [styles.typeSelectorBtnActive, { backgroundColor: colors.text, borderColor: colors.text }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeSelectorText,
                        { color: colors.textMuted },
                        catKind === k && [styles.typeSelectorTextActive, { color: colors.textInverted }],
                      ]}
                    >
                      {k}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                onPress={() => setCategoryModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveCategory}
                style={[styles.modalSubmitBtn, { backgroundColor: colors.text }]}
              >
                <Text style={[styles.modalSubmitText, { color: colors.textInverted }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 5: Export Data View */}
      <Modal visible={exportModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '80%' }]}>
            <Text style={[styles.modalHeading, { color: colors.text }]}>Ledger Export</Text>
            <ScrollView style={[styles.exportScrollBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.exportText, { color: colors.textSecondary }]}>{exportedJson}</Text>
            </ScrollView>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                onPress={() => setExportModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShareJson}
                style={[styles.modalSubmitBtn, { backgroundColor: colors.text }]}
              >
                <Text style={[styles.modalSubmitText, { color: colors.textInverted }]}>Share / Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 6: Paste SMS Detection */}
      <PasteSmsModal
        visible={pasteSmsModalVisible}
        onClose={() => setPasteSmsModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.delightRegular,
    color: '#71717A',
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.delightSemiBold,
    fontWeight: '600',
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  headingWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  addSmallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 4,
  },
  addSmallText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightSemiBold,
    fontWeight: '600',
    color: '#000000',
  },
  sectionCard: {
    backgroundColor: '#141416',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222226',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#26262B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#383840',
  },
  avatarInitial: {
    fontSize: 20,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontFamily: theme.typography.fonts.delightSemiBold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileEmail: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.delightRegular,
    color: '#71717A',
    marginTop: 2,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#26262B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.delightMedium,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  settingSubtitle: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightRegular,
    color: '#71717A',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#222226',
    marginVertical: 12,
  },
  cardStyleToggle: {
    width: 136,
    borderRadius: 12,
  },
  styleOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  styleOptionActive: {
    backgroundColor: '#FFFFFF',
  },
  styleOptionText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightMedium,
    fontWeight: '500',
    color: '#A1A1AA',
  },
  styleOptionTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  accountItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  accountTypeBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A1A1AA',
    backgroundColor: '#26262B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#383840',
  },
  accountItemName: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.delightMedium,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  accountItemBalance: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightRegular,
    color: '#71717A',
    marginTop: 1,
  },
  togglePill: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#26262B',
    padding: 2,
    justifyContent: 'center',
  },
  togglePillActive: {
    backgroundColor: '#10B981',
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  toggleDotActive: {
    alignSelf: 'flex-end',
  },
  emptyNote: {
    fontSize: 13,
    color: '#71717A',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryItemName: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#FFFFFF',
  },
  categoryItemKind: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#16161A',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A30',
  },
  modalHeading: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalHelp: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.delightRegular,
    color: '#71717A',
    marginBottom: 16,
    lineHeight: 18,
  },
  textInput: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#2E2E36',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 15,
  },
  inputGroup: {
    marginBottom: 16,
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#A1A1AA',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeSelectorBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#1E1E24',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E2E36',
  },
  typeSelectorBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  typeSelectorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  typeSelectorTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  modalButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontFamily: theme.typography.fonts.delightMedium,
  },
  modalSubmitBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  modalSubmitText: {
    color: '#000000',
    fontSize: 14,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
  },
  modalDeleteBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  exportScrollBox: {
    maxHeight: 300,
    backgroundColor: '#101012',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#26262B',
  },
  exportText: {
    fontFamily: 'monospace',
    color: '#A1A1AA',
    fontSize: 11,
    lineHeight: 16,
  },
});

