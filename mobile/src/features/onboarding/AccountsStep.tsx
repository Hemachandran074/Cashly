import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { X, Info } from 'lucide-react-native';
import { theme } from '../../theme';
import { useOnboardingStore, DraftAccount } from './onboardingStore';
import { paiseToRupees, rupeesToPaise, formatIndianRupees } from '../../utils/money';

export interface AccountsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export const AccountsStep: React.FC<AccountsStepProps> = ({ onNext, onBack }) => {
  const { accounts, addAccount, updateAccount, removeAccount, getTotalOpeningBalancePaise } =
    useOnboardingStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<DraftAccount['type']>('BANK');
  const [newAccBalance, setNewAccBalance] = useState('');

  const handleCreateAccount = () => {
    if (!newAccName.trim()) return;
    const paise = rupeesToPaise(parseFloat(newAccBalance) || 0);
    addAccount({
      name: newAccName.trim(),
      type: newAccType,
      opening_balance_paise: paise,
    });
    setNewAccName('');
    setNewAccBalance('');
    setNewAccType('BANK');
    setModalVisible(false);
  };

  const totalPaise = getTotalOpeningBalancePaise();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <View style={styles.header}>
          <Text style={styles.stepIndicator}>Step 2 of 5</Text>
          <Text style={styles.title}>Accounts & Balances</Text>
          <Text style={styles.subtitle}>
            Enter the money you currently hold. Opening balances set your initial baseline and are never counted as income.
          </Text>
        </View>

        {/* Total Baseline Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Starting Balance</Text>
          <Text style={styles.totalAmount}>{formatIndianRupees(totalPaise)}</Text>
        </View>

        {/* Accounts List */}
        <View style={styles.accountsList}>
          {accounts.map((acc) => {
            const currentRupees = paiseToRupees(acc.opening_balance_paise);

            return (
              <View key={acc.id} style={styles.accountCard}>
                <View style={styles.accountCardHeader}>
                  <View style={styles.accountNameGroup}>
                    <Text style={styles.accountTypeBadge}>{acc.type}</Text>
                    <Text style={styles.accountName}>{acc.name}</Text>
                  </View>
                  {accounts.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeAccount(acc.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X size={14} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.balanceInputRow}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={styles.balanceInput}
                    placeholder="0"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="numeric"
                    defaultValue={currentRupees > 0 ? currentRupees.toString() : ''}
                    onChangeText={(val) => {
                      const num = parseFloat(val) || 0;
                      updateAccount(acc.id, {
                        opening_balance_paise: rupeesToPaise(num),
                      });
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Add Account Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setModalVisible(true)}
          style={styles.addAccountButton}
        >
          <Text style={styles.addAccountText}>+ Add another account</Text>
        </TouchableOpacity>

        {/* UPI Info Card */}
        <View style={styles.infoBox}>
          <View style={styles.infoBoxHeader}>
            <Info size={14} color={theme.colors.textSecondary} strokeWidth={2} />
            <Text style={styles.infoBoxTitle}>UPI Integration</Text>
          </View>
          <Text style={styles.infoBoxText}>
            UPI apps (Google Pay, PhonePe, Paytm) debit your bank account directly. You do not need a separate balance for them.
          </Text>
        </View>
      </View>

      {/* Navigation Footer */}
      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onNext}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Add Account Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Account</Text>

            <View style={styles.modalForm}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Account Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. HDFC Savings, ICICI"
                  placeholderTextColor={theme.colors.textMuted}
                  value={newAccName}
                  onChangeText={setNewAccName}
                  autoFocus
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Account Type</Text>
                <View style={styles.typeSelector}>
                  {(['BANK', 'CASH', 'WALLET', 'UPI'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setNewAccType(t)}
                      style={[
                        styles.typeOption,
                        newAccType === t && styles.typeOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          newAccType === t && styles.typeOptionTextActive,
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Opening Balance (₹)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="numeric"
                  value={newAccBalance}
                  onChangeText={setNewAccBalance}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreateAccount}
                disabled={!newAccName.trim()}
                style={[
                  styles.modalSaveButton,
                  !newAccName.trim() && styles.modalSaveButtonDisabled,
                ]}
              >
                <Text style={styles.modalSaveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingTop: theme.spacing['3xl'],
    paddingBottom: theme.spacing['4xl'],
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: theme.spacing['2xl'],
  },
  stepIndicator: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    letterSpacing: -0.5,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    lineHeight: theme.typography.lineHeights.sm,
  },
  totalCard: {
    backgroundColor: theme.colors.cardElevated,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  totalLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.weights.medium,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  accountsList: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  accountCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  accountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  accountNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  accountTypeBadge: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.cardElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radii.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  accountName: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  deleteButtonText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    paddingHorizontal: 4,
  },
  balanceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardElevated,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  currencyPrefix: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.xs,
  },
  balanceInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    paddingVertical: theme.spacing.sm + 2,
  },
  addAccountButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.lg,
  },
  addAccountText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  infoBox: {
    backgroundColor: theme.colors.cardElevated,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    marginBottom: theme.spacing.xl,
    gap: 6,
  },
  infoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoBoxTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  infoBoxText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  actions: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  primaryButton: {
    backgroundColor: theme.colors.text,
    borderRadius: theme.radii.pill,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: theme.colors.textInverted,
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
  },
  secondaryButton: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.xl,
    padding: theme.spacing['2xl'],
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
  },
  modalForm: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  modalInputGroup: {
    gap: theme.spacing.xs,
  },
  modalLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  modalInput: {
    backgroundColor: theme.colors.cardElevated,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.base,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.cardElevated,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typeOptionActive: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  typeOptionText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  typeOptionTextActive: {
    color: theme.colors.textInverted,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
  },
  modalCancelButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  modalCancelText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  modalSaveButton: {
    backgroundColor: theme.colors.text,
    borderRadius: theme.radii.pill,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  modalSaveButtonDisabled: {
    opacity: 0.5,
  },
  modalSaveText: {
    color: theme.colors.textInverted,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
  },
});

